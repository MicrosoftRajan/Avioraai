/** Keyword-overlap JD ↔ resume scoring (no LLM). Used by API fallback and accuracy eval. */
export type JdMatchResult = {
  fitScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  atsKeywords: string[];
};

export function heuristicJdMatch(resume: string, jd: string): JdMatchResult {
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
      atsKeywords.length > 0
        ? atsKeywords
        : ["leadership", "cross-functional", "delivery"],
  };
}
