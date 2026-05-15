import { readFileSync } from "fs";
import { resolve } from "path";

import { buildDebriefSummary } from "@/lib/interview-debrief";
import { heuristicJdMatch } from "@/lib/jd-match-heuristic";
import type {
  InterviewDebriefPayload,
  InterviewModeType,
} from "@/lib/interview-session-storage";

export type EvalCheck = {
  id: string;
  suite: string;
  pass: boolean;
  detail: string;
};

type JdFixture = {
  id: string;
  resume: string;
  jd: string;
  minScore: number;
  maxScore: number;
  mustMentionInStrengths?: string[];
  mustMentionGap?: string[];
};

type DebriefFixture = {
  id: string;
  mode: InterviewModeType;
  payload: InterviewDebriefPayload;
  expectCompanyInHeadline?: boolean;
  expectCodingAdvice?: boolean;
  expectWeekCount?: number;
  expectConfidenceAdvice?: boolean;
  minBullets?: number;
};

function loadJson<T>(relPath: string): T {
  const p = resolve(process.cwd(), relPath);
  return JSON.parse(readFileSync(p, "utf8")) as T;
}

export function runHeuristicJdMatchEval(): EvalCheck[] {
  const cases = loadJson<JdFixture[]>("eval/fixtures/jd-match-cases.json");
  const checks: EvalCheck[] = [];

  for (const c of cases) {
    const result = heuristicJdMatch(c.resume, c.jd);
    const scoreOk =
      result.fitScore >= c.minScore && result.fitScore <= c.maxScore;

    checks.push({
      id: `${c.id}-score-range`,
      suite: "jd-match-heuristic",
      pass: scoreOk,
      detail: scoreOk
        ? `fitScore ${result.fitScore} in [${c.minScore}, ${c.maxScore}]`
        : `fitScore ${result.fitScore} outside [${c.minScore}, ${c.maxScore}]`,
    });

    if (c.mustMentionInStrengths?.length) {
      const blob = result.strengths.join(" ").toLowerCase();
      const missing = c.mustMentionInStrengths.filter((k) => !blob.includes(k));
      checks.push({
        id: `${c.id}-strength-keywords`,
        suite: "jd-match-heuristic",
        pass: missing.length === 0,
        detail:
          missing.length === 0
            ? "Strengths reference expected overlap terms"
            : `Missing in strengths: ${missing.join(", ")}`,
      });
    }

    if (c.mustMentionGap?.length) {
      const blob = [
        ...result.weaknesses,
        ...result.atsKeywords,
        ...result.improvements,
      ]
        .join(" ")
        .toLowerCase();
      const found = c.mustMentionGap.filter((k) => blob.includes(k));
      checks.push({
        id: `${c.id}-gap-keywords`,
        suite: "jd-match-heuristic",
        pass: found.length > 0,
        detail:
          found.length > 0
            ? `Gap terms surfaced: ${found.join(", ")}`
            : `Expected gap terms not surfaced: ${c.mustMentionGap.join(", ")}`,
      });
    }
  }

  return checks;
}

export function runDebriefEval(): EvalCheck[] {
  const cases = loadJson<DebriefFixture[]>("eval/fixtures/debrief-cases.json");
  const checks: EvalCheck[] = [];

  for (const c of cases) {
    const summary = buildDebriefSummary(c.mode, c.payload);
    const bullets = summary.bullets ?? [];
    const blob = [summary.headline, ...bullets].join(" ").toLowerCase();

    if (c.minBullets != null) {
      checks.push({
        id: `${c.id}-min-bullets`,
        suite: "debrief-rules",
        pass: bullets.length >= c.minBullets,
        detail: `${bullets.length} bullets (need ≥ ${c.minBullets})`,
      });
    }

    if (c.expectCompanyInHeadline) {
      const ok = summary.headline
        .toLowerCase()
        .includes(c.payload.company.toLowerCase());
      checks.push({
        id: `${c.id}-company-in-headline`,
        suite: "debrief-rules",
        pass: ok,
        detail: ok
          ? `Headline mentions ${c.payload.company}`
          : `Headline missing company: "${summary.headline}"`,
      });
    }

    if (c.expectCodingAdvice) {
      const ok = /coding|workspace|prompt|redo/i.test(blob);
      checks.push({
        id: `${c.id}-coding-advice`,
        suite: "debrief-rules",
        pass: ok,
        detail: ok
          ? "Debrief references coding practice"
          : "No coding-related coaching bullet found",
      });
    }

    if (c.expectWeekCount != null) {
      const weeks = summary.roadmap ?? [];
      checks.push({
        id: `${c.id}-roadmap-weeks`,
        suite: "debrief-rules",
        pass: weeks.length === c.expectWeekCount,
        detail: `${weeks.length} roadmap weeks (expected ${c.expectWeekCount})`,
      });
    }

    if (c.expectConfidenceAdvice) {
      const ok = /confidence|unsure|bridging/i.test(blob);
      checks.push({
        id: `${c.id}-confidence-advice`,
        suite: "debrief-rules",
        pass: ok,
        detail: ok
          ? "Coaching addresses confidence / uncertainty"
          : "No confidence coaching despite weakness hints",
      });
    }
  }

  return checks;
}

/** Fraction of user transcript terms (4+ chars) appearing in AI debrief bullets. */
export function scoreDebriefGrounding(
  messages: InterviewDebriefPayload["messages"],
  bullets: string[],
): number {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");
  const tokens = [
    ...new Set(
      userText
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4),
    ),
  ];
  if (tokens.length === 0) return 1;

  const bulletBlob = bullets.join(" ").toLowerCase();
  const hit = tokens.filter((t) => bulletBlob.includes(t)).length;
  return hit / tokens.length;
}

export async function runAiJdMatchEval(
  baseUrl: string,
): Promise<EvalCheck[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [
      {
        id: "ai-jd-skipped",
        suite: "jd-match-ai",
        pass: true,
        detail: "Skipped — OPENAI_API_KEY not set",
      },
    ];
  }

  const cases = loadJson<JdFixture[]>("eval/fixtures/jd-match-cases.json");
  const checks: EvalCheck[] = [];

  for (const c of cases) {
    try {
      const res = await fetch(`${baseUrl}/api/interview/jd-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: c.resume,
          jobDescription: c.jd,
          company: "EvalCorp",
        }),
      });
      if (!res.ok) {
        checks.push({
          id: `${c.id}-ai-call`,
          suite: "jd-match-ai",
          pass: false,
          detail: `HTTP ${res.status}`,
        });
        continue;
      }
      const data = (await res.json()) as {
        fitScore?: number;
        strengths?: string[];
      };
      const score = data.fitScore ?? 0;
      const scoreOk = score >= c.minScore && score <= c.maxScore;
      checks.push({
        id: `${c.id}-ai-score-range`,
        suite: "jd-match-ai",
        pass: scoreOk,
        detail: scoreOk
          ? `AI fitScore ${score} in [${c.minScore}, ${c.maxScore}]`
          : `AI fitScore ${score} outside [${c.minScore}, ${c.maxScore}]`,
      });
      checks.push({
        id: `${c.id}-ai-has-strengths`,
        suite: "jd-match-ai",
        pass: Array.isArray(data.strengths) && data.strengths.length >= 2,
        detail: `${data.strengths?.length ?? 0} strength bullets`,
      });
    } catch (e) {
      checks.push({
        id: `${c.id}-ai-call`,
        suite: "jd-match-ai",
        pass: false,
        detail: e instanceof Error ? e.message : "Request failed",
      });
    }
  }

  return checks;
}

export async function runAiDebriefGroundingEval(
  baseUrl: string,
): Promise<EvalCheck[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [
      {
        id: "ai-debrief-skipped",
        suite: "debrief-ai-grounding",
        pass: true,
        detail: "Skipped — OPENAI_API_KEY not set",
      },
    ];
  }

  const fixture: DebriefFixture = {
    id: "grounding-sample",
    mode: "mock",
    payload: {
      mode: "mock",
      name: "Riley",
      company: "Netflix",
      durationMinutes: 30,
      messages: [
        {
          role: "assistant",
          content: "Describe a performance optimization you led.",
        },
        {
          role: "user",
          content:
            "I reduced checkout latency by caching Redis sessions and profiling PostgreSQL slow queries.",
        },
      ],
      weaknessHints: ["Precision / hedge language"],
      codingQuestion: null,
      endedAt: Date.now(),
      roundStage: "technical",
    },
  };

  try {
    const res = await fetch(`${baseUrl}/api/interview/debrief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...fixture.payload,
        mode: fixture.mode,
      }),
    });
    if (!res.ok) {
      return [
        {
          id: "ai-debrief-http",
          suite: "debrief-ai-grounding",
          pass: false,
          detail: `HTTP ${res.status}`,
        },
      ];
    }
    const data = (await res.json()) as {
      summary?: { bullets?: string[] };
      aiEnhanced?: boolean;
    };
    const bullets = data.summary?.bullets ?? [];
    const rate = scoreDebriefGrounding(fixture.payload.messages, bullets);
    const threshold = 0.15;

    return [
      {
        id: "ai-debrief-grounding-rate",
        suite: "debrief-ai-grounding",
        pass: rate >= threshold,
        detail: `Grounding ${(rate * 100).toFixed(0)}% of user terms in bullets (threshold ${(threshold * 100).toFixed(0)}%, aiEnhanced=${data.aiEnhanced})`,
      },
      {
        id: "ai-debrief-has-bullets",
        suite: "debrief-ai-grounding",
        pass: bullets.length >= 3,
        detail:
          bullets.length >= 3
            ? `${bullets.length} debrief bullets`
            : `Only ${bullets.length} bullets (expected ≥ 3)`,
      },
    ];
  } catch (e) {
    return [
      {
        id: "ai-debrief-call",
        suite: "debrief-ai-grounding",
        pass: false,
        detail: e instanceof Error ? e.message : "Request failed",
      },
    ];
  }
}

export function summarizeChecks(checks: EvalCheck[]) {
  const passed = checks.filter((c) => c.pass).length;
  const total = checks.length;
  const rate = total > 0 ? (passed / total) * 100 : 0;
  const bySuite = new Map<string, EvalCheck[]>();
  for (const c of checks) {
    const list = bySuite.get(c.suite) ?? [];
    list.push(c);
    bySuite.set(c.suite, list);
  }
  return { passed, total, rate, bySuite };
}
