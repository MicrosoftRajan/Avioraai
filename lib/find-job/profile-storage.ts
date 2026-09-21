import type { ApplicationRecord, FindJobProfile } from "./types";

export const FIND_JOB_PROFILE_KEY = "aviora-find-job-profile";
export const FIND_JOB_APPLICATIONS_KEY = "aviora-find-job-applications";

export function saveFindJobProfile(profile: FindJobProfile) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FIND_JOB_PROFILE_KEY, JSON.stringify(profile));
}

export function loadFindJobProfile(): FindJobProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FIND_JOB_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FindJobProfile;
  } catch {
    return null;
  }
}

export function loadApplications(): ApplicationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FIND_JOB_APPLICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ApplicationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendApplications(rows: ApplicationRecord[]) {
  if (typeof window === "undefined" || !rows.length) return;
  const prev = loadApplications();
  const next = [...rows, ...prev].slice(0, 80);
  localStorage.setItem(FIND_JOB_APPLICATIONS_KEY, JSON.stringify(next));
}
