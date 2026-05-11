import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      resumeText?: string;
      company?: string;
    };
    const resumeText = (body.resumeText ?? "").trim().slice(0, 14_000);
    const company = (body.company ?? "the target company").trim();

    if (!resumeText.length) {
      return NextResponse.json({ error: "Resume text required" }, { status: 400 });
    }

    const fallback = [
      "Walk through your most impactful project on the CV — architecture and trade-offs.",
      "How do you prioritize reliability vs velocity when shipping?",
      "Explain a production incident you owned end-to-end.",
      "How do you review code and uphold quality standards?",
      "Describe how you collaborate across functions (product, design, infra).",
      "What metrics prove your feature moved the needle?",
      "How do you approach testing strategy for a risky change?",
      "Where would you invest technical debt paydown next quarter?",
    ];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ questions: fallback });
    }

    const prompt = `List exactly 10 concise technical interview questions a hiring loop at ${company} might ask this candidate, grounded in their resume. Mix behavioral-technical and depth probes. One question per line in JSON array only: {"questions":["..."]}

Resume excerpt:
${resumeText.slice(0, 8000)}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.45,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ questions: fallback });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    try {
      const parsed = JSON.parse(raw) as { questions?: string[] };
      const questions = Array.isArray(parsed.questions)
        ? parsed.questions.map((q) => q.trim()).filter(Boolean).slice(0, 12)
        : [];
      return NextResponse.json({
        questions: questions.length ? questions : fallback,
      });
    } catch {
      return NextResponse.json({ questions: fallback });
    }
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
