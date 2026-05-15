export const INTERVIEW_SESSION_KEY = "aviora_interview_session_v1";
export const INTERVIEW_DEBRIEF_KEY = "aviora_interview_debrief_v1";

export type InterviewModeType = "mock" | "roadmap";

/** Interview funnel stage from setup form (voice rounds omit screening). */
export type InterviewRoundStage =
  | "screening"
  | "technical"
  | "managerial"
  | "hr";

export type InterviewSessionPayload = {
  name: string;
  company: string;
  resumeText: string;
  resumeFileName: string;
  durationMinutes: number;
  /** Defaults to technical when missing (older sessions). */
  roundStage?: InterviewRoundStage;
  /** Job description for screening JD ↔ CV match */
  jobDescription?: string;
  mode?: InterviewModeType;
  /** Row id in Supabase `interview_mode_session` when server persist succeeds */
  supabaseSessionId?: string;
  /** Assigned mock interviewer (voice rounds) */
  interviewerName?: string;
  interviewerTitle?: string;
};

export type InterviewTranscriptLine = {
  role: "user" | "assistant";
  content: string;
};

export type InterviewDebriefPayload = {
  mode: InterviewModeType;
  name: string;
  company: string;
  durationMinutes: number;
  messages: InterviewTranscriptLine[];
  weaknessHints: string[];
  codingQuestion: string | null;
  endedAt: number;
  roundStage?: InterviewRoundStage;
};
