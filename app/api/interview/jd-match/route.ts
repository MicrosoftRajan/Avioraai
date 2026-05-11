import { NextResponse } from "next/server";

const MAX_RESUME = 48_000;
const MAX_JD = 24_000;

type JdMatchBody = {
  resumeText?: string;
  jobDescription?: string;
  company?: string;
};

function heuristicMatch(resume: string, jd: string) {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const rSet = new Set(norm(resume));
  const jdWords = norm(jd);
  const meaningful = jdWords.filter((w) => w.length > 3);
  let hits = 0;
  for (const w of meaningful) {
    if (rSet.has(w)) hits++;
  }
  const ratio =
    meaningful.length > 0 ? Math.min(1, hits / meaningful.length) : 0;
  const fitScore = Math.round(Math.min(94, 38 + ratio * 56));

  const sampleKw = [...new Set(meaningful)].slice(0, 40);
  const atsKeywords = sampleKw.filter((k) => !rSet.has(k)).slice(0, 12);
  const matched = sampleKw.filter((k) => rSet.has(k)).slice(0, 8);

  return {
    fitScore,
    strengths: matched.length
      ? [
          `Overlapping vocabulary with the JD (${matched.slice(0, 5).join(", ")})`,
          "Baseline overlap computed without AI — add detail for precision.",
        ]
      : ["Resume covers general professional themes"],
    weaknesses: atsKeywords.length
      ? [
          `JD emphasizes terms not prominent on your CV: ${atsKeywords.slice(0, 6).join(", ")}`,
        ]
      : ["Paste a fuller JD to surface keyword gaps"],
    improvements: [
      "Mirror JD section headers (e.g. Requirements) with matching bullets where truthful.",
      "Quantify outcomes next to each skill the JD names.",
      "Add one line per must-have tool/stack from the posting.",
    ],
    atsKeywords:
      atsKeywords.length > 0 ? atsKeywords : ["leadership", "cross-functional", "delivery"],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as JdMatchBody;
    const resumeText = (body.resumeText ?? "").trim().slice(0, MAX_RESUME);
    const jobDescription = (body.jobDescription ?? "").trim().slice(0, MAX_JD);
    const company = (body.company ?? "the employer").trim();

    if (!resumeText.length || !jobDescription.length) {
      return NextResponse.json(
        { error: "Resume text and job description are required." },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(heuristicMatch(resumeText, jobDescription));
    }

    const prompt = `You compare a candidate resume to a job description for ${company}.
Return ONLY valid JSON (no markdown) with this shape:
{"fitScore":number,"strengths":string[],"weaknesses":string[],"improvements":string[],"atsKeywords":string[]}

Rules:
- fitScore is integer 0-100 estimating ATS + recruiter alignment (honest, not inflated).
- strengths: 3-5 concise bullets tied to JD requirements actually reflected in the resume.
- weaknesses: 3-5 gaps or risks (missing skills, thin evidence, seniority mismatch).
- improvements: 4-6 specific edits the candidate should make to the resume (actionable).
- atsKeywords: 8-14 exact multi-word or single-word phrases from the JD the resume should mirror if truthful (ATS-friendly).

Resume:
---
${resumeText.slice(0, 12000)}
---

Job description:
---
${jobDescription.slice(0, 12000)}
---`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(heuristicMatch(resumeText, jobDescription));
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    try {
      const parsed = JSON.parse(raw) as {
        fitScore?: number;
        strengths?: string[];
        weaknesses?: string[];
        improvements?: string[];
        atsKeywords?: string[];
      };
      const fitScore = Math.min(
        100,
        Math.max(0, Math.round(Number(parsed.fitScore) || 0)),
      );
      return NextResponse.json({
        fitScore,
        strengths: Array.isArray(parsed.strengths)
          ? parsed.strengths.slice(0, 8)
          : [],
        weaknesses: Array.isArray(parsed.weaknesses)
          ? parsed.weaknesses.slice(0, 8)
          : [],
        improvements: Array.isArray(parsed.improvements)
          ? parsed.improvements.slice(0, 10)
          : [],
        atsKeywords: Array.isArray(parsed.atsKeywords)
          ? parsed.atsKeywords.slice(0, 16)
          : [],
      });
    } catch {
      return NextResponse.json(heuristicMatch(resumeText, jobDescription));
    }
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
