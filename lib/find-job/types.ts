export type JobAts = "greenhouse" | "lever" | "ashby" | "workday" | "other";

export type JobSourceKind =
  | "remoteok"
  | "remotive"
  | "arbeitnow"
  | "himalayas"
  | "jobicy"
  | "weworkremotely"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "jsearch"
  | "adzuna"
  | "career_page"
  | "apple"
  | "microsoft"
  | "amazon"
  | "google"
  | "naukri"
  | "linkedin";

export type FeaturedCompanyId =
  | "microsoft"
  | "wellsfargo"
  | "spglobal"
  | "samsung"
  | "apple"
  | "amazon"
  | "google"
  | "nvidia"
  | "adobe"
  | "salesforce"
  | "intel"
  | "cisco"
  | "disney"
  | "warnerbros";

export type RemoteJobSource =
  | "remoteok"
  | "remotive"
  | "arbeitnow"
  | "himalayas"
  | "jobicy"
  | "weworkremotely";

export const REMOTE_JOB_SOURCES: RemoteJobSource[] = [
  "remoteok",
  "remotive",
  "arbeitnow",
  "himalayas",
  "jobicy",
  "weworkremotely",
];

export function isRemoteJobSource(source: string): source is RemoteJobSource {
  return (REMOTE_JOB_SOURCES as readonly string[]).includes(source);
}

export type JobBoardId =
  | FeaturedCompanyId
  | "naukri"
  | "linkedin"
  | "tech"
  | "remote";

export type ExperienceLevel = "intern" | "entry" | "mid" | "senior" | "lead";

export type NormalizedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  country?: string;
  experienceLevel?: ExperienceLevel;
  remote: boolean;
  url: string;
  applyUrl: string;
  description: string;
  source: JobSourceKind;
  sourceLabel: string;
  postedAt?: string;
  ats: JobAts;
  atsBoard?: string;
  atsJobId?: string;
  tags?: string[];
  featuredCompany?: FeaturedCompanyId;
};

export type ScoredJob = NormalizedJob & {
  previewScore: number;
};

export type FindJobProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  targetTitles: string;
  skills: string;
  workAuth: string;
  remoteOnly: boolean;
  experienceYears: string;
  resumeText: string;
  resumeFileName: string;
  careerPageUrls: string;
  autoAlign: boolean;
  minFitScore: number;
};

export type ResumeAlignResult = {
  alignedResume: string;
  coverLetter: string;
  changes: string[];
  fitScoreBefore: number;
  fitScoreAfter: number;
};

export type ApplyMethod = "lever_api" | "greenhouse_api" | "apply_link";

export type ApplyEventType =
  | "start"
  | "job_start"
  | "score"
  | "aligning"
  | "aligned"
  | "applying"
  | "applied"
  | "ready"
  | "skipped"
  | "error"
  | "done";

export type ApplyEvent = {
  type: ApplyEventType;
  jobId?: string;
  title?: string;
  company?: string;
  fitScore?: number;
  aligned?: boolean;
  alignedResume?: string;
  coverLetter?: string;
  changes?: string[];
  method?: ApplyMethod;
  applyUrl?: string;
  message?: string;
  total?: number;
  submitted?: number;
  ready?: number;
  failed?: number;
};

export type ApplicationRecord = {
  jobId: string;
  title: string;
  company: string;
  applyUrl: string;
  status: "submitted" | "ready" | "skipped" | "failed";
  method?: ApplyMethod;
  fitScore: number;
  aligned: boolean;
  alignedResume?: string;
  coverLetter?: string;
  message?: string;
  at: string;
};
