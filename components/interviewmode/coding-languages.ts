export const INTERVIEW_CODING_LANGUAGES = [
  "C",
  "C++",
  "Java",
  "Python",
  "Go",
] as const;

export type InterviewCodingLanguage =
  (typeof INTERVIEW_CODING_LANGUAGES)[number];

function matchesLang(h: string, lang: InterviewCodingLanguage): boolean {
  const aliases: Record<InterviewCodingLanguage, string[]> = {
    C: ["c"],
    "C++": ["c++", "cpp", "cplusplus"],
    Java: ["java"],
    Python: ["python", "py"],
    Go: ["go", "golang"],
  };
  return aliases[lang].includes(h);
}

/** Maps assistant hints (and common aliases) to one of the IDE languages. */
export function coerceInterviewCodingLanguage(
  hint: string,
): InterviewCodingLanguage {
  const h = hint.trim().toLowerCase().replace(/\s+/g, "");
  if (!h) return "Python";

  for (const lang of INTERVIEW_CODING_LANGUAGES) {
    if (h === lang.toLowerCase().replace(/\s+/g, "") || matchesLang(h, lang)) {
      return lang;
    }
  }

  if (
    h.includes("typescript") ||
    h.includes("javascript") ||
    h.includes("kotlin") ||
    h.includes("rust") ||
    h.includes("ruby") ||
    h.includes("swift")
  ) {
    return "Java";
  }

  return "Python";
}

export function defaultInterviewCodingLanguage(): InterviewCodingLanguage {
  return "Python";
}
