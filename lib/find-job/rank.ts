import { heuristicJdMatch } from "@/lib/jd-match-heuristic";
import type { FindJobProfile, NormalizedJob, ScoredJob } from "./types";

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function jobMatchesQuery(job: NormalizedJob, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay =
    `${job.title} ${job.company} ${job.location} ${job.tags?.join(" ") ?? ""} ${job.description.slice(0, 800)}`.toLowerCase();
  const parts = q
    .split(/[,/]| and /i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.some((p) => hay.includes(p))) return true;
  const qTokens = tokens(q);
  const hits = qTokens.filter((t) => hay.includes(t)).length;
  return hits >= Math.min(2, qTokens.length);
}

export function rankJobs(
  jobs: NormalizedJob[],
  profile: Pick<
    FindJobProfile,
    "targetTitles" | "skills" | "resumeText" | "remoteOnly" | "location"
  >,
): ScoredJob[] {
  const query = `${profile.targetTitles} ${profile.skills}`.trim();
  const filtered = jobs.filter((j) => {
    if (
      profile.remoteOnly &&
      !j.remote &&
      !/remote|anywhere|distributed/i.test(j.location)
    ) {
      return false;
    }
    return jobMatchesQuery(j, query || profile.resumeText.slice(0, 400));
  });

  const pool = filtered.length ? filtered : jobs;
  const resume = profile.resumeText.slice(0, 12_000);
  const loc = profile.location.trim().toLowerCase();

  const scored = pool.map((job) => {
    const blob =
      `${job.title}\n${job.company}\n${job.location}\n${job.description}`.slice(
        0,
        8_000,
      );
    let previewScore = heuristicJdMatch(resume, blob).fitScore;
    if (loc && job.location.toLowerCase().includes(loc.split(",")[0] ?? loc)) {
      previewScore = Math.min(99, previewScore + 4);
    }
    if (job.remote && profile.remoteOnly) {
      previewScore = Math.min(99, previewScore + 2);
    }
    return { ...job, previewScore };
  });

  scored.sort((a, b) => b.previewScore - a.previewScore);
  return scored;
}

export function dedupeJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of jobs) {
    const key = `${job.company}|${job.title}`.toLowerCase().replace(/\s+/g, " ");
    const urlKey = job.url.split("?")[0]?.toLowerCase() ?? job.url;
    if (seen.has(key) || seen.has(urlKey)) continue;
    seen.add(key);
    seen.add(urlKey);
    out.push(job);
  }
  return out;
}
