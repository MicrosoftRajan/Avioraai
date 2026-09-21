import { fetchAmazonJobs } from "./amazon";
import { fetchAppleJobs } from "./apple";
import { WORKDAY_BOARDS } from "./career-boards";
import { fetchWorkdayJobs, type CareerTarget } from "./career-page";
import { fetchGoogleJobs } from "./google";
import { enrichJob } from "./job-filters";
import {
  listScrapedJobs,
  upsertScrapedJobs,
  type JobStoreBackend,
} from "./job-store";
import {
  curatedBoardFetches,
  fetchArbeitnow,
  fetchHimalayas,
  fetchJobicy,
  fetchRemoteOk,
  fetchRemotive,
  fetchWeWorkRemotely,
} from "./job-sources";
import { fetchLinkedInJobs } from "./linkedin";
import { fetchMicrosoftJobs } from "./microsoft";
import { fetchNaukriJobs } from "./naukri";
import {
  isRemoteJobSource,
  type FeaturedCompanyId,
  type JobBoardId,
  type NormalizedJob,
} from "./types";

export const FEATURED_COMPANIES: {
  id: FeaturedCompanyId;
  label: string;
  careerUrl: string;
}[] = [
  {
    id: "microsoft",
    label: "Microsoft",
    careerUrl: "https://apply.careers.microsoft.com/careers",
  },
  {
    id: "apple",
    label: "Apple",
    careerUrl: "https://jobs.apple.com/en-us/search",
  },
  {
    id: "amazon",
    label: "Amazon",
    careerUrl: "https://www.amazon.jobs/en/",
  },
  {
    id: "google",
    label: "Google",
    careerUrl: "https://www.google.com/about/careers/applications/jobs/results",
  },
  ...WORKDAY_BOARDS.map((b) => ({
    id: b.id,
    label: b.company,
    careerUrl: b.careerUrl,
  })),
];

const CACHE_MS = 90_000;
const COMPANY_TIMEOUT_MS = 90_000;

export function countBoardJobs(
  jobs: NormalizedJob[],
): Partial<Record<JobBoardId, number>> {
  const counts: Partial<Record<JobBoardId, number>> = {};
  for (const job of jobs) {
    if (job.source === "naukri" || job.source === "linkedin") {
      counts[job.source] = (counts[job.source] ?? 0) + 1;
      continue;
    }
    if (isRemoteJobSource(job.source)) {
      counts.remote = (counts.remote ?? 0) + 1;
      continue;
    }
    if (
      job.source === "greenhouse" ||
      job.source === "lever" ||
      job.source === "ashby"
    ) {
      counts.tech = (counts.tech ?? 0) + 1;
      continue;
    }
    const key = job.featuredCompany;
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export type FeaturedJobsResult = {
  jobs: NormalizedJob[];
  counts: Partial<Record<JobBoardId, number>>;
  scrapedAt: string | null;
  fromStore: boolean;
  backend: JobStoreBackend;
};

let featuredCache: {
  at: number;
  jobs: NormalizedJob[];
  counts: Partial<Record<JobBoardId, number>>;
  scrapedAt: string | null;
  backend: JobStoreBackend;
} | null = null;

let scrapeInFlight: Promise<FeaturedJobsResult> | null = null;

function dedupeFeatured(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of jobs) {
    const urlKey = job.url.split("?")[0]?.toLowerCase() ?? job.url;
    if (seen.has(job.id) || seen.has(urlKey)) continue;
    seen.add(job.id);
    seen.add(urlKey);
    out.push(job);
  }
  return out;
}

function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

function scrapeOne(fn: () => Promise<NormalizedJob[]>): Promise<NormalizedJob[]> {
  return withTimeout(
    fn().catch(() => [] as NormalizedJob[]),
    [],
    COMPANY_TIMEOUT_MS,
  );
}

async function scrapeFeaturedCareerJobs(): Promise<{
  jobs: NormalizedJob[];
  counts: Partial<Record<JobBoardId, number>>;
}> {
  const workday = WORKDAY_BOARDS.map((board) => {
    const target: Extract<CareerTarget, { kind: "workday" }> = {
      kind: "workday",
      host: board.host,
      tenant: board.tenant,
      site: board.site,
      company: board.company,
    };
    return scrapeOne(() =>
      fetchWorkdayJobs(target, "", {
        maxPages: board.maxPages,
        featuredCompany: board.id,
      }),
    );
  });

  const batches = await Promise.all([
    ...workday,
    scrapeOne(() => fetchAppleJobs(20)),
    scrapeOne(() => fetchMicrosoftJobs()),
    scrapeOne(() => fetchAmazonJobs(5)),
    scrapeOne(() => fetchGoogleJobs(10)),
    scrapeOne(() => fetchNaukriJobs({ limit: 200 })),
    scrapeOne(() => fetchLinkedInJobs()),
    scrapeOne(() => fetchRemoteOk()),
    scrapeOne(() => fetchRemotive()),
    scrapeOne(() => fetchArbeitnow()),
    scrapeOne(() => fetchHimalayas()),
    scrapeOne(() => fetchJobicy()),
    scrapeOne(() => fetchWeWorkRemotely()),
    ...curatedBoardFetches("", 40, false).map((p) => scrapeOne(() => p)),
  ]);

  const jobs = dedupeFeatured(batches.flat().map(enrichJob));
  return { jobs, counts: countBoardJobs(jobs) };
}

function remember(
  jobs: NormalizedJob[],
  scrapedAt: string | null,
  backend: JobStoreBackend,
): FeaturedJobsResult {
  const counts = countBoardJobs(jobs);
  featuredCache = {
    at: Date.now(),
    jobs,
    counts,
    scrapedAt,
    backend,
  };
  return {
    jobs,
    counts,
    scrapedAt,
    fromStore: true,
    backend,
  };
}

export async function scrapeAndPersist(): Promise<FeaturedJobsResult> {
  if (scrapeInFlight) return scrapeInFlight;
  scrapeInFlight = (async () => {
    const scraped = await scrapeFeaturedCareerJobs();
    const backend = await upsertScrapedJobs(scraped.jobs);
    const stored = await listScrapedJobs({ featuredOnly: true });
    const jobs = stored.jobs.length ? stored.jobs : scraped.jobs;
    const scrapedAt = stored.scrapedAt ?? new Date().toISOString();
    const result = remember(jobs, scrapedAt, stored.backend || backend);
    return { ...result, fromStore: false };
  })().finally(() => {
    scrapeInFlight = null;
  });
  return scrapeInFlight;
}

export async function fetchFeaturedCareerJobs(opts?: {
  fresh?: boolean;
}): Promise<FeaturedJobsResult> {
  if (
    !opts?.fresh &&
    featuredCache &&
    Date.now() - featuredCache.at < CACHE_MS
  ) {
    return {
      jobs: featuredCache.jobs,
      counts: featuredCache.counts,
      scrapedAt: featuredCache.scrapedAt,
      fromStore: true,
      backend: featuredCache.backend,
    };
  }

  if (!opts?.fresh) {
    const stored = await listScrapedJobs({ featuredOnly: true });
    if (stored.jobs.length) {
      return remember(stored.jobs, stored.scrapedAt, stored.backend);
    }
  }

  return scrapeAndPersist();
}

export function newestFirst(jobs: NormalizedJob[]): NormalizedJob[] {
  const rank = (posted?: string) => {
    if (posted == null || posted === "") return 0;
    const value = typeof posted === "string" ? posted : String(posted);
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return t;
    const lower = value.toLowerCase();
    if (lower.includes("today")) return Date.now();
    if (lower.includes("yesterday")) return Date.now() - 86_400_000;
    const days = lower.match(/posted\s+(\d+)\s+day/);
    if (days) return Date.now() - Number(days[1]) * 86_400_000;
    return 0;
  };
  return [...jobs].sort((a, b) => rank(b.postedAt) - rank(a.postedAt));
}
