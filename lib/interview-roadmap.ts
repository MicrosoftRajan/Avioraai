import type {
  InterviewRoundStage,
  InterviewTranscriptLine,
} from "@/lib/interview-session-storage";

export type RoadmapPhaseStatus = "upcoming" | "current" | "done" | "flagged";
export type RoadmapWeekConfidence = "seed" | "emerging" | "grounded";

export type InterviewArcPhase = {
  id: string;
  label: string;
  hint: string;
  status: RoadmapPhaseStatus;
};

export type LiveRoadmapWeek = {
  id: string;
  title: string;
  focus: string[];
  reason: string;
  confidence: RoadmapWeekConfidence;
};

export type LiveInterviewRoadmap = {
  headline: string;
  coachingNote: string;
  progressPct: number;
  currentPhaseId: string;
  arc: InterviewArcPhase[];
  weeks: LiveRoadmapWeek[];
  signals: string[];
  topicsCovered: string[];
};

export type LiveRoadmapInput = {
  company: string;
  roundStage: InterviewRoundStage;
  messages: InterviewTranscriptLine[];
  weaknessHints: string[];
  codingQuestion?: string | null;
  codingOpen?: boolean;
  callActive?: boolean;
};

type ArcDef = Omit<InterviewArcPhase, "status"> & {
  evidence: (ctx: EvidenceCtx) => boolean;
};

type EvidenceCtx = {
  blob: string;
  userBlob: string;
  assistantBlob: string;
  messageCount: number;
  userTurns: number;
  codingOpen: boolean;
  codingQuestion: string;
  callActive: boolean;
};

const TOPIC_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "algorithms", re: /\b(algorithm|big.?o|complexity|two.?sum|hash|tree|graph|dp|dynamic programming)\b/i },
  { id: "system design", re: /\b(scal(?:e|ed|ing)|distributed|microservice|shard|cach(?:e|ing|ed)?|throughput|latency|load balancer|queue)\b/i },
  { id: "testing", re: /\b(test|unit test|integration|qa|edge case|coverage)\b/i },
  { id: "ownership", re: /\b(owned|ownership|accountable|end.?to.?end|drove)\b/i },
  { id: "metrics", re: /\b(\d+%|metric|kpi|latency|revenue|users|conversion)\b/i },
  { id: "collaboration", re: /\b(stakeholder|cross.?functional|product|design|team|mentor)\b/i },
  { id: "coding", re: /\b(implement|leetcode|function|code|workspace|linked list|array)\b/i },
  { id: "leadership", re: /\b(priorit|conflict|hire|org|strategy|vision|cadence)\b/i },
  { id: "motivation", re: /\b(why (this|our) company|culture|values|notice period|compensation)\b/i },
];

function blobOf(messages: InterviewTranscriptLine[], role?: InterviewTranscriptLine["role"]) {
  return messages
    .filter((m) => !role || m.role === role)
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();
}

function technicalArc(): ArcDef[] {
  return [
    {
      id: "open",
      label: "Opening",
      hint: "Rapport and permission to start",
      evidence: (c) => c.callActive || c.messageCount > 0,
    },
    {
      id: "resume",
      label: "Resume review",
      hint: "Projects, stack, and ownership on the CV",
      evidence: (c) =>
        c.userTurns >= 1 &&
        /\b(resume|cv|role at|experience|project|walk me through|tell me about|your time|stack|built)\b/i.test(
          c.blob,
        ),
    },
    {
      id: "depth",
      label: "Technical depth",
      hint: "Trade-offs, internals, and why",
      evidence: (c) =>
        /\b(trade-?off|complexity|big.?o|architect|scal(?:e|ed|ing)|latency|throughput|why did you|how would you|distributed|cach(?:e|ing|ed)?|database|bottleneck)\b/i.test(
          c.blob,
        ),
    },
    {
      id: "coding",
      label: "Coding",
      hint: "Timed problem in the workspace",
      evidence: (c) =>
        c.codingOpen ||
        Boolean(c.codingQuestion) ||
        /\b(coding environment|implement|leetcode|write a function|open the (ide|workspace))\b/i.test(
          c.blob,
        ),
    },
    {
      id: "close",
      label: "Wrap-up",
      hint: "Candidate questions and close",
      evidence: (c) =>
        /\b(questions for me|wrap|that'?s all|thank you for (your )?time|we'?re at time|conclude)\b/i.test(
          c.blob,
        ),
    },
  ];
}

function managerialArc(): ArcDef[] {
  return [
    {
      id: "open",
      label: "Opening",
      hint: "Executive rapport",
      evidence: (c) => c.callActive || c.messageCount > 0,
    },
    {
      id: "delivery",
      label: "Delivery",
      hint: "Scope, risk, and accountability",
      evidence: (c) =>
        /\b(deliver|ship|timeline|risk|owned|accountable|milestone|priority)\b/i.test(c.blob),
    },
    {
      id: "people",
      label: "People & stakeholders",
      hint: "Conflict, mentoring, alignment",
      evidence: (c) =>
        /\b(stakeholder|conflict|mentor|hire|team|cross.?functional|alignment)\b/i.test(c.blob),
    },
    {
      id: "strategy",
      label: "Strategy",
      hint: "Org trade-offs and vision",
      evidence: (c) =>
        /\b(strateg|org|vision|capacity|roadmap|investment|trade-?off)\b/i.test(c.blob),
    },
    {
      id: "close",
      label: "Wrap-up",
      hint: "Close and next steps",
      evidence: (c) =>
        /\b(questions for me|wrap|that'?s all|thank you for (your )?time)\b/i.test(c.blob),
    },
  ];
}

function hrArc(): ArcDef[] {
  return [
    {
      id: "open",
      label: "Opening",
      hint: "Courteous start",
      evidence: (c) => c.callActive || c.messageCount > 0,
    },
    {
      id: "motivation",
      label: "Motivation",
      hint: "Why this company and role",
      evidence: (c) =>
        /\b(why (this|our)|interest|motivat|company|role|career)\b/i.test(c.blob),
    },
    {
      id: "collaboration",
      label: "Ways of working",
      hint: "Values and collaboration",
      evidence: (c) =>
        /\b(values|culture|collaborat|feedback|ways of working|team)\b/i.test(c.blob),
    },
    {
      id: "logistics",
      label: "Expectations",
      hint: "Notice, location, compensation framing",
      evidence: (c) =>
        /\b(notice|compensat|location|start date|expectation|policy)\b/i.test(c.blob),
    },
    {
      id: "close",
      label: "Wrap-up",
      hint: "Close the screen",
      evidence: (c) =>
        /\b(questions for me|wrap|that'?s all|thank you for (your )?time)\b/i.test(c.blob),
    },
  ];
}

function arcForStage(stage: InterviewRoundStage): ArcDef[] {
  if (stage === "managerial") return managerialArc();
  if (stage === "hr") return hrArc();
  return technicalArc();
}

export function extractTopicsCovered(messages: InterviewTranscriptLine[]): string[] {
  const blob = blobOf(messages);
  return TOPIC_PATTERNS.filter((t) => t.re.test(blob)).map((t) => t.id);
}

function inferSignals(
  messages: InterviewTranscriptLine[],
  weaknessHints: string[],
): string[] {
  const userLines = messages.filter((m) => m.role === "user").map((m) => m.content);
  const extra: string[] = [...weaknessHints];
  const shortCount = userLines.filter((l) => l.trim().length > 0 && l.trim().length < 48).length;
  if (shortCount >= 2) extra.push("Answers too brief — expand with STAR + metrics");
  const userBlob = userLines.join(" ").toLowerCase();
  if (/\bi don't know\b|\bnot sure\b|\bno idea\b/.test(userBlob)) {
    extra.push("Practice bridging when a gap appears");
  }
  if (/\b(um+|uh+|like,|you know)\b/i.test(userBlob) && userBlob.split(/\s+/).length > 40) {
    extra.push("Cut filler — land a crisp takeaway");
  }
  return [...new Set(extra.map((s) => s.trim()).filter(Boolean))].slice(0, 8);
}

function confidenceFor(evidenceHits: number, callActive: boolean, userTurns: number): RoadmapWeekConfidence {
  if (evidenceHits >= 2 || userTurns >= 4) return "grounded";
  if (evidenceHits >= 1 || (callActive && userTurns >= 1)) return "emerging";
  return "seed";
}

function buildWeeks(input: LiveRoadmapInput, ctx: EvidenceCtx, signals: string[], topics: string[]): LiveRoadmapWeek[] {
  const company = input.company.trim() || "the company";
  const stage = input.roundStage;
  const coding = (input.codingQuestion ?? "").trim();

  const slot1: LiveRoadmapWeek = {
    id: "communication",
    title: "Week 1 — Communication & structure",
    focus: [
      "Daily 10-minute spoken answers with a STAR skeleton.",
      "Cut filler; end each answer with one measurable takeaway.",
    ],
    reason: "Default interview hygiene — refined as your answers land.",
    confidence: "seed",
  };
  if (signals.some((s) => /brief|filler|length|structure/i.test(s))) {
    slot1.focus = [
      "Rehearse 90-second STAR answers: Situation → Action → metric.",
      "If you hedge, name the assumption then propose a next step.",
    ];
    slot1.reason = "Today’s answers were thin or hedged — structure is the fastest win.";
    slot1.confidence = confidenceFor(2, ctx.callActive, ctx.userTurns);
  } else if (ctx.userTurns >= 1) {
    slot1.reason = "Your spoken answers are being scored for clarity as we go.";
    slot1.confidence = confidenceFor(1, ctx.callActive, ctx.userTurns);
  }

  let slot2: LiveRoadmapWeek;
  if (stage === "managerial") {
    slot2 = {
      id: "leadership",
      title: "Week 2 — Leadership depth",
      focus: [
        "Prep two conflict and two delivery-risk stories with stakeholders named.",
        "Practice executive summaries: decision, trade-off, outcome.",
      ],
      reason: "Managerial loops reward judgment under ambiguity.",
      confidence: "seed",
    };
    if (topics.includes("leadership") || topics.includes("collaboration")) {
      slot2.reason = "Leadership themes already showed up in this conversation.";
      slot2.confidence = confidenceFor(2, ctx.callActive, ctx.userTurns);
      slot2.focus[0] =
        "Rewrite today’s leadership example with org impact and a metric.";
    }
  } else if (stage === "hr") {
    slot2 = {
      id: "narrative",
      title: "Week 2 — Career narrative",
      focus: [
        "Tighten why this company in 45 seconds — values + evidence.",
        "Prepare a polished notice / logistics answer without oversharing.",
      ],
      reason: "HR screens hinge on motivation and professional framing.",
      confidence: "seed",
    };
    if (topics.includes("motivation")) {
      slot2.reason = "Motivation came up live — make the story company-specific.";
      slot2.confidence = confidenceFor(2, ctx.callActive, ctx.userTurns);
    }
  } else {
    slot2 = {
      id: "technical-depth",
      title: "Week 2 — Technical depth",
      focus: [
        "Two timed drills on resume technologies — internals, not APIs only.",
        topics.includes("system design")
          ? "Sketch one system: caching, sharding, and back-pressure."
          : "Add a diagram for one complex project this week.",
      ],
      reason: "Technical rounds probe why, not just what you shipped.",
      confidence: "seed",
    };
    if (topics.includes("system design")) {
      slot2.reason = "Scaling / systems language appeared in the transcript.";
      slot2.confidence = confidenceFor(2, ctx.callActive, ctx.userTurns);
    } else if (topics.includes("algorithms")) {
      slot2.focus[0] = "Verbalize Big-O and memory trade-offs before coding.";
      slot2.reason = "Algorithm talk showed up — make complexity first-class.";
      slot2.confidence = confidenceFor(2, ctx.callActive, ctx.userTurns);
    } else if (ctx.userTurns >= 2) {
      slot2.confidence = "emerging";
    }
  }

  let slot3: LiveRoadmapWeek;
  if (coding) {
    slot3 = {
      id: "coding",
      title: "Week 3 — Coding fluency",
      focus: [
        `Repeat today’s prompt until comfortable under 25 minutes: ${coding.slice(0, 80)}`,
        "Say edge cases and tests out loud before writing code.",
      ],
      reason: "A live coding prompt is on the table — drill that pattern.",
      confidence: ctx.codingOpen || coding ? "grounded" : "emerging",
    };
  } else if (signals.some((s) => /confidence|uncertain|bridging/i.test(s))) {
    slot3 = {
      id: "confidence",
      title: "Week 3 — Confidence under uncertainty",
      focus: [
        "Practice: clarify assumptions, then propose a debug / research path.",
        "Keep a 15-second bridge phrase ready instead of stalling.",
      ],
      reason: "Hesitation showed up in your answers — treat it as a skill, not a verdict.",
      confidence: "grounded",
    };
  } else if (topics.includes("system design") && stage === "technical") {
    slot3 = {
      id: "systems",
      title: "Week 3 — Systems narratives",
      focus: [
        "One page design weekly: API, data, failure modes.",
        "Tie a resume project to scale, cost, and operability.",
      ],
      reason: "The interviewer is already in systems territory.",
      confidence: "emerging",
    };
  } else if (stage === "technical") {
    slot3 = {
      id: "coding",
      title: "Week 3 — Coding fluency",
      focus: [
        "3 medium pattern drills that map to technologies on your CV.",
        "Write edge-case checks aloud before coding.",
      ],
      reason: "Most technical loops still include a timed coding beat.",
      confidence: ctx.userTurns >= 2 ? "emerging" : "seed",
    };
  } else {
    slot3 = {
      id: "presence",
      title: "Week 3 — Executive presence",
      focus: [
        "Record two answers; replace casual wording with precise verbs.",
        "Open with the decision, then supporting evidence.",
      ],
      reason: "Formal rounds reward concise, high-signal language.",
      confidence: ctx.userTurns >= 2 ? "emerging" : "seed",
    };
  }

  const slot4: LiveRoadmapWeek = {
    id: "company",
    title: "Week 4 — Company calibration",
    focus: [
      `Research ${company} engineering / product posts and map them to your CV.`,
      "Run one mock with interruptions in this same interviewer persona.",
    ],
    reason: `Every drill should sound like a loop at ${company}.`,
    confidence: ctx.userTurns >= 1 ? "emerging" : "seed",
  };

  return [slot1, slot2, slot3, slot4];
}

function scoreArc(defs: ArcDef[], ctx: EvidenceCtx): InterviewArcPhase[] {
  const hits = defs.map((d) => d.evidence(ctx));
  let last = 0;
  for (let i = 0; i < hits.length; i++) {
    if (hits[i]) last = i;
  }
  // Opening is current as soon as the call is live, even with no transcript yet.
  if (ctx.callActive && ctx.messageCount === 0) last = 0;

  return defs.map((d, i) => {
    let status: RoadmapPhaseStatus = "upcoming";
    if (i < last) status = "done";
    else if (i === last) status = "current";
    return { id: d.id, label: d.label, hint: d.hint, status };
  });
}

function headlineFor(
  company: string,
  arc: InterviewArcPhase[],
  callActive: boolean,
  userTurns: number,
): string {
  const current = arc.find(
    (p) => p.status === "current" || p.status === "flagged",
  );
  if (!callActive && userTurns === 0) {
    return `Live roadmap for ${company} — starts with your first answer`;
  }
  if (!current) return `Personalized roadmap for ${company}`;
  if (current.id === "open") return `Interview opening at ${company} — plan will lock to your answers`;
  return `In ${current.label.toLowerCase()} · roadmap updating from this ${company} loop`;
}

function coachingFor(
  current: InterviewArcPhase | undefined,
  signals: string[],
  userTurns: number,
  callActive: boolean,
): string {
  if (!callActive && userTurns === 0) {
    return "Start the session — this plan reshapes from what you actually say, not a generic template.";
  }
  if (signals[0]) {
    return `Live signal: ${signals[0]}. Keep going — later weeks will absorb this.`;
  }
  if (current?.id === "open") {
    return "Settle in, then let the first resume story land with a metric.";
  }
  if (current?.id === "coding") {
    return "Talk through edge cases before typing. The week-3 drill will track this prompt.";
  }
  if (current?.id === "close") {
    return "Ask one sharp question about the team’s current hard problem.";
  }
  return current
    ? `Stay in ${current.label.toLowerCase()}: ${current.hint}.`
    : "Keep answers specific — names, numbers, and trade-offs.";
}

export function buildLiveInterviewRoadmap(input: LiveRoadmapInput): LiveInterviewRoadmap {
  const messages = input.messages ?? [];
  const ctx: EvidenceCtx = {
    blob: blobOf(messages),
    userBlob: blobOf(messages, "user"),
    assistantBlob: blobOf(messages, "assistant"),
    messageCount: messages.length,
    userTurns: messages.filter((m) => m.role === "user").length,
    codingOpen: Boolean(input.codingOpen),
    codingQuestion: (input.codingQuestion ?? "").trim(),
    callActive: Boolean(input.callActive),
  };

  const defs = arcForStage(input.roundStage === "screening" ? "hr" : input.roundStage);
  const arc = scoreArc(defs, ctx);
  const current = arc.find((p) => p.status === "current") ?? arc[0];
  const doneCount = arc.filter((p) => p.status === "done").length;
  const progressPct = Math.min(
    100,
    Math.round(((doneCount + (current ? 0.45 : 0)) / Math.max(arc.length, 1)) * 100),
  );
  const topicsCovered = extractTopicsCovered(messages);
  const signals = inferSignals(messages, input.weaknessHints ?? []);
  const weeks = buildWeeks(input, ctx, signals, topicsCovered);

  if (signals.length && current && current.id !== "open") {
    current.status = "flagged";
  }

  return {
    headline: headlineFor(input.company.trim() || "your target company", arc, ctx.callActive, ctx.userTurns),
    coachingNote: coachingFor(current, signals, ctx.userTurns, ctx.callActive),
    progressPct,
    currentPhaseId: current?.id ?? "open",
    arc,
    weeks,
    signals,
    topicsCovered,
  };
}

export function snapshotLiveRoadmap(roadmap: LiveInterviewRoadmap) {
  return {
    headline: roadmap.headline,
    coachingNote: roadmap.coachingNote,
    weeks: roadmap.weeks.map((w) => ({ title: w.title, focus: w.focus })),
    signals: roadmap.signals,
    topicsCovered: roadmap.topicsCovered,
  };
}

export function mergeAiRoadmap(
  local: LiveInterviewRoadmap,
  ai: Partial<Pick<LiveInterviewRoadmap, "headline" | "coachingNote" | "weeks" | "topicsCovered">>,
): LiveInterviewRoadmap {
      const weeks =
    Array.isArray(ai.weeks) && ai.weeks.length
      ? ai.weeks.slice(0, 4).map((w, i) => {
          const fallback = local.weeks[i] ?? local.weeks[0];
          if (
            fallback &&
            fallback.confidence === "grounded" &&
            w.confidence !== "grounded"
          ) {
            return fallback;
          }
          const focus = Array.isArray(w.focus)
            ? w.focus.map((f) => String(f).trim()).filter(Boolean).slice(0, 3)
            : fallback.focus;
          return {
            id: w.id || fallback.id,
            title: (w.title || fallback.title).trim(),
            focus: focus.length ? focus : fallback.focus,
            reason: (w.reason || fallback.reason).trim(),
            confidence: w.confidence ?? fallback.confidence,
          } satisfies LiveRoadmapWeek;
        })
      : local.weeks;

  while (weeks.length < 4 && local.weeks[weeks.length]) {
    weeks.push(local.weeks[weeks.length]);
  }

  return {
    ...local,
    headline: ai.headline?.trim() || local.headline,
    coachingNote: ai.coachingNote?.trim() || local.coachingNote,
    weeks: weeks.slice(0, 4),
    topicsCovered:
      Array.isArray(ai.topicsCovered) && ai.topicsCovered.length
        ? [...new Set([...local.topicsCovered, ...ai.topicsCovered.map((t) => t.trim()).filter(Boolean)])]
        : local.topicsCovered,
  };
}
