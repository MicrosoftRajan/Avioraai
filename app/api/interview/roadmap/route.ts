import {
  buildLiveInterviewRoadmap,
  mergeAiRoadmap,
  type LiveInterviewRoadmap,
} from "@/lib/interview-roadmap";
import { openaiChatCompletion } from "@/lib/openai-chat";
import type {
  InterviewRoundStage,
  InterviewTranscriptLine,
} from "@/lib/interview-session-storage";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      company?: string;
      roundStage?: InterviewRoundStage;
      messages?: InterviewTranscriptLine[];
      weaknessHints?: string[];
      codingQuestion?: string | null;
      codingOpen?: boolean;
      callActive?: boolean;
    };

    const company = (body.company ?? "").trim();
    if (!company || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const local = buildLiveInterviewRoadmap({
      company,
      roundStage: body.roundStage ?? "technical",
      messages: body.messages,
      weaknessHints: body.weaknessHints ?? [],
      codingQuestion: body.codingQuestion ?? null,
      codingOpen: Boolean(body.codingOpen),
      callActive: body.callActive !== false,
    });

    if (!process.env.OPENAI_API_KEY || body.messages.length < 2) {
      return NextResponse.json({ roadmap: local, aiEnhanced: false });
    }

    const transcript = body.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 9000);

    const chat = await openaiChatCompletion({
      json: true,
      temperature: 0.35,
      maxTokens: 900,
      messages: [
        {
          role: "user",
          content: `You are a live interview coach. The candidate is in a ${body.roundStage ?? "technical"} round at ${company}.
Update a 4-week study roadmap from THIS conversation so far — not a generic plan.

Return ONLY JSON:
{"headline": string, "coachingNote": string, "topicsCovered": string[], "weeks":[{"id":string,"title":string,"focus":[string,string],"reason":string,"confidence":"seed"|"emerging"|"grounded"}]}

Rules:
- headline: 8–14 words, what is happening NOW in the interview.
- coachingNote: one sentence the candidate can use on the next answer.
- weeks: exactly 4, titled "Week N — …". Ground focus items in transcript topics and weakness hints ${JSON.stringify(body.weaknessHints ?? [])}.
- confidence grounded only when the transcript clearly supports that week.
- Never mention AI, models, or that this is a simulation.

Transcript:
${transcript}`,
        },
      ],
    });

    if (!chat.ok) {
      return NextResponse.json({ roadmap: local, aiEnhanced: false });
    }

    try {
      const parsed = JSON.parse(chat.content) as Partial<LiveInterviewRoadmap>;
      const roadmap = mergeAiRoadmap(local, parsed);
      return NextResponse.json({ roadmap, aiEnhanced: true });
    } catch {
      return NextResponse.json({ roadmap: local, aiEnhanced: false });
    }
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
