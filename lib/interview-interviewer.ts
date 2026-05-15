import type { InterviewRoundStage } from "@/lib/interview-session-storage";

export type InterviewerPersona = {
  name: string;
  firstName: string;
  title: string;
};

const TECHNICAL: InterviewerPersona[] = [
  { name: "Priya Sharma", firstName: "Priya", title: "Senior Engineering Manager" },
  { name: "Marcus Chen", firstName: "Marcus", title: "Staff Software Engineer" },
  { name: "Elena Volkov", firstName: "Elena", title: "Principal Engineer" },
];

const MANAGERIAL: InterviewerPersona[] = [
  { name: "James Whitfield", firstName: "James", title: "Director of Engineering" },
  { name: "Sandra Okonkwo", firstName: "Sandra", title: "VP of Engineering" },
];

const HR: InterviewerPersona[] = [
  { name: "Rachel Foster", firstName: "Rachel", title: "Senior HR Business Partner" },
  { name: "David Park", firstName: "David", title: "Talent Acquisition Lead" },
];

const POOLS: Record<Exclude<InterviewRoundStage, "screening">, InterviewerPersona[]> = {
  technical: TECHNICAL,
  managerial: MANAGERIAL,
  hr: HR,
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Stable interviewer for a company + round (same inputs → same person). */
export function pickInterviewer(
  roundStage: InterviewRoundStage,
  company: string,
): InterviewerPersona {
  const stage =
    roundStage === "screening" ? "hr" : roundStage;
  const pool = POOLS[stage];
  const idx = hashString(`${company.trim().toLowerCase()}:${stage}`) % pool.length;
  return pool[idx]!;
}
