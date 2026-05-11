import type { InterviewRoundStage } from "@/lib/interview-session-storage";

export type InterviewProfile = {
  name: string;
  company: string;
  resumeFile: File | null;
  /** Plain text extracted server-side from resume */
  resumeText: string;
  durationMinutes: number;
  roundStage: InterviewRoundStage;
  /** Required when roundStage is screening */
  jobDescription?: string;
};

export const INTERVIEW_ROUND_OPTIONS: {
  value: InterviewRoundStage;
  label: string;
}[] = [
  { value: "screening", label: "Screening Round" },
  { value: "technical", label: "Technical Round" },
  { value: "managerial", label: "Managerial Round" },
  { value: "hr", label: "HR Round" },
];
