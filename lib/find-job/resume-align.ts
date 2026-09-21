import { heuristicJdMatch } from "@/lib/jd-match-heuristic";
import { openaiChatCompletion } from "@/lib/openai-chat";
import type { FindJobProfile, ResumeAlignResult } from "./types";

const MAX_RESUME = 10_000;
const MAX_JD = 8_000;

function fallbackAlign(
  resume: string,
  jd: string,
  profile: Pick<FindJobProfile, "skills" | "targetTitles" | "name">,
): ResumeAlignResult {
  const before = heuristicJdMatch(resume, jd);
  const skillList = profile.skills
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const jdLower = jd.toLowerCase();
  const truthfulKw = [
    ...before.atsKeywords.filter((k) => {
      const kl = k.toLowerCase();
      return (
        resume.toLowerCase().includes(kl) ||
        skillList.some(
          (s) => s.toLowerCase().includes(kl) || kl.includes(s.toLowerCase()),
        )
      );
    }),
    ...skillList.filter((s) => jdLower.includes(s.toLowerCase())).slice(0, 8),
  ].filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);

  const alignedResume = `${resume.trim()}

---
TARGET ROLE ALIGNMENT
${profile.targetTitles ? `Target titles: ${profile.targetTitles}` : ""}
${truthfulKw.length ? `JD-aligned skills already evidenced: ${truthfulKw.join(" · ")}` : ""}
${before.improvements
  .slice(0, 3)
  .map((x) => `• ${x}`)
  .join("\n")}
`.trim();

  const after = heuristicJdMatch(alignedResume, jd);
  return {
    alignedResume,
    coverLetter: `Dear Hiring Team,\n\nI am applying for this role and attaching a resume focused on the requirements in your posting. My background includes ${profile.targetTitles || "relevant experience"} and skills such as ${skillList.slice(0, 6).join(", ") || "the attached resume"}.\n\nI would welcome the chance to discuss how I can contribute.\n\nSincerely,\n${profile.name}`,
    changes: [
      "Appended a truthful JD-alignment section from overlapping skills.",
      ...before.improvements.slice(0, 2),
    ],
    fitScoreBefore: before.fitScore,
    fitScoreAfter: Math.max(before.fitScore, after.fitScore),
  };
}

export async function alignResumeToJd(input: {
  resumeText: string;
  jobDescription: string;
  company: string;
  title: string;
  profile: Pick<FindJobProfile, "name" | "skills" | "targetTitles" | "location">;
}): Promise<ResumeAlignResult> {
  const resume = input.resumeText.trim().slice(0, MAX_RESUME);
  const jd = input.jobDescription.trim().slice(0, MAX_JD);
  const before = heuristicJdMatch(resume, jd);

  if (!process.env.OPENAI_API_KEY) {
    return fallbackAlign(resume, jd, input.profile);
  }

  const prompt = `You rewrite a candidate resume so it is aligned to one job description (ATS + recruiter).
Return ONLY valid JSON:
{"alignedResume":string,"coverLetter":string,"changes":string[],"fitScoreEstimate":number}

HARD RULES:
- Never invent employers, titles, dates, degrees, certifications, or metrics.
- Never add skills that are not supported by the resume or the candidate skills list.
- Reorder and rephrase existing bullets to mirror JD language where truthful.
- Keep clear section headers (plain text, not markdown tables).
- Cover letter: 3 short paragraphs, specific to ${input.company} / ${input.title}, no fluff.
- fitScoreEstimate: integer 0-100 after the rewrite (honest).

Candidate name: ${input.profile.name}
Target titles: ${input.profile.targetTitles || "(none)"}
Skills they listed: ${input.profile.skills || "(none)"}
Location: ${input.profile.location || "(none)"}

Current resume:
---
${resume}
---

Job description:
---
${jd}
---`;

  const chat = await openaiChatCompletion({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    json: true,
    maxTokens: 2200,
  });

  if (!chat.ok) {
    return fallbackAlign(resume, jd, input.profile);
  }

  try {
    const parsed = JSON.parse(chat.content) as {
      alignedResume?: string;
      coverLetter?: string;
      changes?: string[];
      fitScoreEstimate?: number;
    };
    const alignedResume = (parsed.alignedResume ?? "").trim() || resume;
    const after = heuristicJdMatch(alignedResume, jd);
    const llmScore = Math.min(
      100,
      Math.max(0, Math.round(Number(parsed.fitScoreEstimate) || after.fitScore)),
    );
    return {
      alignedResume,
      coverLetter:
        (parsed.coverLetter ?? "").trim() ||
        fallbackAlign(resume, jd, input.profile).coverLetter,
      changes: Array.isArray(parsed.changes)
        ? parsed.changes.slice(0, 8)
        : ["Rewrote phrasing to mirror the JD where truthful."],
      fitScoreBefore: before.fitScore,
      fitScoreAfter: Math.max(after.fitScore, llmScore),
    };
  } catch {
    return fallbackAlign(resume, jd, input.profile);
  }
}
