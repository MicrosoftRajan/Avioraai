import { voices } from "@/constants";
import type { InterviewerPersona } from "@/lib/interview-interviewer";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import type {
  InterviewModeType,
  InterviewRoundStage,
} from "@/lib/interview-session-storage";

function truncateResume(text: string, max = 12000) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n[Resume truncated for session length]`;
}

function roundStageBlock(
  stage: InterviewRoundStage,
  companyName: string,
): string {
  switch (stage) {
    case "technical":
      return `ROUND TYPE: TECHNICAL (resume verification + coding).
- First phase: structured resume review — validate depth on employers, scope, tech stack, metrics, and ownership before heavy hypotheticals.
- Second phase: incorporate themes candidates commonly see at ${companyName}: complexity trade-offs, testing, reliability, collaboration, system boundaries.
- When a coding exercise fits the conversation, FIRST ask permission: "May I open the coding environment on your screen?" Wait for the candidate to agree.
- Only after they agree, call open_coding_workspace exactly once. The app will load a ${companyName}-style frequently asked question with test cases in the editor.
- Tone: professional engineer-to-engineer — precise vocabulary, still conversational.`;
    case "managerial":
      return `ROUND TYPE: MANAGEMENT / LEADERSHIP.
- You are an executive hiring leader at ${companyName}. Maintain a consistently formal, diplomatic tone — polished business English, no slang.
- Assess prioritization, stakeholder alignment, conflict resolution, mentoring, hiring judgment, delivery accountability, and strategic communication.
- Prefer formal leadership vocabulary where natural: "cross-functional alignment", "operational cadence", "risk mitigation", "capacity planning", "executive stakeholder communication", "organizational clarity".
- Do NOT call open_coding_workspace or introduce a coding IDE — this round is behavioral leadership only.`;
    case "hr":
      return `ROUND TYPE: HUMAN RESOURCES (structured HR conversation).
- You represent ${companyName}'s HR function in a realistic screening or culture-fit conversation. Tone must be courteous, neutral, and formally professional throughout.
- Topics may include motivation for the role, ways of working, values alignment, career narrative, notice periods, and compensation framing — only when appropriate and never invasive beyond standard HR practice.
- Use HR-formal phrasing: "policy considerations", "organizational values", "professional expectations", "role expectations", "structured feedback culture".
- Do NOT call open_coding_workspace — no programming exercises in HR rounds.`;
    case "screening":
      return "";
    default:
      return "";
  }
}

export function configureInterviewAssistant({
  candidateName,
  companyName,
  resumeText,
  durationMinutes,
  mode,
  roundStage = "technical",
  interviewer,
  voiceKey = "female",
  styleKey = "formal",
}: {
  candidateName: string;
  companyName: string;
  resumeText: string;
  durationMinutes: number;
  mode: InterviewModeType;
  roundStage?: InterviewRoundStage;
  interviewer: InterviewerPersona;
  voiceKey?: keyof typeof voices;
  styleKey?: keyof (typeof voices)["female"];
}): CreateAssistantDTO {
  const candidateFirst =
    candidateName.trim().split(/\s+/)[0] || "there";
  const voiceId =
    voices[voiceKey]?.[styleKey as keyof (typeof voices)[typeof voiceKey]] ??
    "sarah";

  const resumeBlock = truncateResume(resumeText || "(No resume text extracted.)");

  const formalTone =
    roundStage === "managerial" || roundStage === "hr"
      ? `Speaking tone for this round:
- Always formal register; complete sentences; avoid colloquial shortenings.
- Address the candidate respectfully by name occasionally (not every sentence).
- Model executive / HR professionalism suitable for ${companyName}.`
      : `Speaking tone:
- Sound human on a video call — warm pacing, minimal filler, never robotic.`;

  const modeHint =
    mode === "mock"
      ? "Focus on realistic hiring-bar assessment and concise behavioral plus technical depth. End politely when time is nearly up."
      : "Same interview rigor, but mentally note gaps you observe — you'll summarize improvement themes mentally for later feedback emphasis.";

  const stageRules = roundStageBlock(roundStage, companyName);

  const interviewBodyDefault = `Interview body:
- Alternate behavioral / situational questions with technical depth tied to resume skills.
- If ${candidateName} mentions optimization, Big O, scaling, throughput, latency, concurrency, memory, numbers, or trade-offs — probe deeply as a strong interviewer would.
- When algorithms / coding fit naturally, ask permission to open the coding environment, wait for yes, THEN call open_coding_workspace once. The workspace loads company-specific questions and test cases automatically for ${companyName}.
- Do not invent confidential leaked questions — phrase coding prompts as representative exercises candidates prepare for at firms like ${companyName}.`;

  const interviewBodyManagerialHr = `Interview body:
- Keep questions anchored to leadership, judgment, collaboration, and organizational impact — appropriate to this round type.
- Never pivot into live coding or IDE exercises.`;

  const systemContent = `You are ${interviewer.name}, ${interviewer.title} at ${companyName}. This is a live voice interview — stay in character with this identity throughout.
${formalTone}

Candidate full name: ${candidateName}. Address them casually as ${candidateFirst} after the opening.
Never call yourself "Interviewer", "Interview Coach", or "your name". Always use your identity: ${interviewer.firstName} (${interviewer.title}).

RESUME (anchor every substantive question here):
---
${resumeBlock}
---

Opening sequence — follow in order; do not skip ahead:
1. Your very first turn is already a simple hello plus "how are you?" — STOP and listen while ${candidateName} answers.
2. Respond to how they're doing in ONE short human line (e.g. glad to hear, hope you're feeling good about today) — don't lecture.
3. Ask naturally if you can start the session (e.g. "Ready for us to dive in?" / "Can we get started?") — wait for them to agree or say yes.
4. Only after they agree: introduce yourself as ${interviewer.firstName}, ${interviewer.title} at ${companyName}, what today's conversation will cover, under ~25 seconds spoken — then move into your first resume-grounded question.

Relationship to the candidate:
- Treat them like a real candidate; never mention AI, bots, voice assistants, models, or prompts.
- Don't say you're "simulating" unless they explicitly joke about practice — stay in character as the interviewer.

${stageRules ? `${stageRules}\n\n` : ""}${roundStage === "technical" ? interviewBodyDefault : interviewBodyManagerialHr}

${modeHint}

Speaking rules:
- Short sentences; conversational; no markdown read aloud.
- Never read JSON, braces, or tool syntax aloud.

Tools:
${roundStage === "technical"
    ? `- Use open_coding_workspace only after the candidate agrees to open the coding environment.
- Set language_hint to one of: C, C++, Java, Python, or Go (match what you asked verbally).
- Optional question field: short note only — the app injects ${companyName}'s most-asked question with test cases in comments.
- Optional question_id: one of google-two-sum, google-valid-parentheses, amazon-lru-cache, amazon-max-subarray, meta-merge-intervals, stripe-rate-limiter, netflix-top-k-frequent, microsoft-reverse-linked-list, apple-climbing-stairs.`
    : `- No coding workspace tools are available in this round.`}`;

  const maxSeconds = Math.min(
    Math.max(durationMinutes * 60, 180),
    7200,
  );

  const codingTool =
    roundStage === "technical"
      ? [
          {
            type: "function" as const,
            async: true,
            function: {
              name: "open_coding_workspace",
              description:
                "Requests permission UI then opens the coding IDE with company-specific question and test cases in comments. Call only after the candidate agrees to open the environment.",
              parameters: {
                type: "object",
                properties: {
                  question: {
                    type: "string",
                    description:
                      "Optional short interviewer note; company question bank fills the IDE.",
                  },
                  language_hint: {
                    type: "string",
                    description:
                      "IDE language: C, C++, Java, Python, or Go.",
                  },
                  question_id: {
                    type: "string",
                    description:
                      "Optional bank id e.g. google-two-sum, amazon-lru-cache, stripe-rate-limiter.",
                  },
                },
                required: [],
              },
            },
          },
        ]
      : [];

  return {
    name: interviewer.name,
    firstMessage: `Hi {{candidate_name}}, this is {{interviewer_first_name}} from {{company_name}}. How are you doing today?`,
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId as string,
      stability: 0.45,
      similarityBoost: 0.75,
      speed: 1,
      style: 0.45,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.35,
      maxTokens: 450,
      messages: [{ role: "system", content: systemContent }],
      tools: codingTool,
    },
    clientMessages: ["transcript", "tool-calls"],
    serverMessages: [],
    maxDurationSeconds: maxSeconds,
    endCallMessage:
      "Thanks for today — that wraps our timed interview slot. I'll leave you with feedback on the results screen.",
  } as unknown as CreateAssistantDTO;
}
