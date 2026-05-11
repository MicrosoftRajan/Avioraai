import { buildDebriefSummary } from "@/lib/interview-debrief";
import type {
  InterviewDebriefPayload,
  InterviewModeType,
} from "@/lib/interview-session-storage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InterviewDebriefPayload & {
      mode: InterviewModeType;
    };
    if (!body?.mode || !body?.name || !body?.company || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payload: InterviewDebriefPayload = {
      mode: body.mode,
      name: body.name,
      company: body.company,
      durationMinutes: body.durationMinutes ?? 30,
      messages: body.messages,
      weaknessHints: body.weaknessHints ?? [],
      codingQuestion: body.codingQuestion ?? null,
      endedAt: body.endedAt ?? Date.now(),
      roundStage: body.roundStage,
    };

    const summary = buildDebriefSummary(body.mode, payload);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ summary, aiEnhanced: false });
    }

    try {
      const transcript = payload.messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")
        .slice(0, 14000);

      const rs = payload.roundStage ?? "technical";

      if (rs === "managerial" || rs === "hr") {
        const lens =
          rs === "hr"
            ? "human-resources screening tone and HR professionalism"
            : "management / leadership executive dialogue";

        const formalPrompt = `You review a mock interview transcript for ${payload.company} (${lens}).
Return ONLY valid JSON:
{"bullets": string[], "professionalAudit": {"improvements": [{"line": string, "highlightTerms": string[]}], "vocabularyObserved": string[]}}

Rules:
- bullets: 5-7 concise coaching bullets on presence, clarity, and formal executive communication.
- improvements.line: each is one actionable improvement sentence; highlightTerms: 1-3 formal vocabulary words FROM that sentence to emphasize visually (must appear verbatim in line).
- vocabularyObserved: 10-18 notable words or short phrases the CANDIDATE (user lines) actually used — mark mix of strong professional usage and casual wording they should upgrade.

Transcript:
${transcript}`;

        const formalRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: formalPrompt }],
              temperature: 0.35,
              response_format: { type: "json_object" },
            }),
          },
        );

        if (formalRes.ok) {
          const formalData = (await formalRes.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const rawJson =
            formalData.choices?.[0]?.message?.content?.trim() ?? "";
          try {
            const parsed = JSON.parse(rawJson) as {
              bullets?: string[];
              professionalAudit?: {
                improvements?: {
                  line?: string;
                  highlightTerms?: string[];
                }[];
                vocabularyObserved?: string[];
              };
            };
            const bullets = Array.isArray(parsed.bullets)
              ? parsed.bullets.map((b) => b.trim()).filter(Boolean).slice(0, 10)
              : [];
            const audit = parsed.professionalAudit;
            const professionalAudit =
              audit &&
              Array.isArray(audit.improvements) &&
              audit.improvements.length
                ? {
                    improvements: audit.improvements
                      .map((i) => ({
                        line: (i.line ?? "").trim(),
                        highlightTerms: Array.isArray(i.highlightTerms)
                          ? i.highlightTerms.map((t) => t.trim()).filter(Boolean)
                          : [],
                      }))
                      .filter((i) => i.line.length > 0)
                      .slice(0, 12),
                    vocabularyObserved: Array.isArray(audit.vocabularyObserved)
                      ? audit.vocabularyObserved
                          .map((w) => w.trim())
                          .filter(Boolean)
                          .slice(0, 24)
                      : [],
                  }
                : undefined;

            if (bullets.length || professionalAudit) {
              return NextResponse.json({
                summary: {
                  ...summary,
                  ...(bullets.length ? { bullets } : {}),
                  ...(professionalAudit ? { professionalAudit } : {}),
                },
                aiEnhanced: true,
              });
            }
          } catch {
            /* fall through */
          }
        }
      }

      const prompt =
        body.mode === "mock"
          ? `You help candidates prepare for ${payload.company}. Given transcript snippets, list 5 concise bullets on how to improve to clear their hiring bar. No fluff.\n\nTranscript:\n${transcript}`
          : `You are a coach. Given transcript snippets and weaknesses hints ${JSON.stringify(payload.weaknessHints)}, produce a 4-week study roadmap JSON array weeks[{title, focus:[string,string]}]. Output ONLY JSON.\n\nTranscript:\n${transcript}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ summary, aiEnhanced: false });
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";

      if (body.mode === "mock") {
        const bullets = content
          .split(/\n+/)
          .map((l) => l.replace(/^[-*\d.)]+\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 8);
        if (bullets.length) {
          return NextResponse.json({
            summary: { ...summary, bullets },
            aiEnhanced: true,
          });
        }
      } else {
        try {
          const parsed = JSON.parse(content) as {
            weeks?: { title: string; focus: string[] }[];
          };
          if (Array.isArray(parsed.weeks) && parsed.weeks.length) {
            return NextResponse.json({
              summary: {
                ...summary,
                roadmap: parsed.weeks,
              },
              aiEnhanced: true,
            });
          }
        } catch {
          /* fallback below */
        }
      }

      return NextResponse.json({ summary, aiEnhanced: false });
    } catch {
      return NextResponse.json({ summary, aiEnhanced: false });
    }
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
