import { fetchBrowserText, hashId, truncate } from "./http";
import { enrichJob } from "./job-filters";
import type { NormalizedJob } from "./types";

type AppleJob = {
  id?: string;
  positionId?: string | number;
  postingTitle?: string;
  jobSummary?: string;
  postingDate?: string;
  postDateInGMT?: string;
  transformedPostingTitle?: string;
  homeOffice?: boolean;
  locations?: {
    name?: string;
    city?: string;
    countryName?: string;
  }[];
};

type AppleHydration = {
  loaderData?: {
    search?: AppleJob[] | { searchResults?: AppleJob[]; totalRecords?: number };
  };
};

function parseHydration(html: string): {
  jobs: AppleJob[];
  total: number;
} {
  const marker = "window.__staticRouterHydrationData = JSON.parse(";
  const start = html.indexOf(marker);
  if (start < 0) return { jobs: [], total: 0 };

  const from = start + marker.length;
  const quote = html[from];
  if (quote !== '"' && quote !== "'") return { jobs: [], total: 0 };

  let i = from + 1;
  let escaped = false;
  while (i < html.length) {
    const ch = html[i];
    if (escaped) {
      escaped = false;
      i += 1;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      i += 1;
      continue;
    }
    if (ch === quote) break;
    i += 1;
  }

  const literal = html.slice(from, i + 1);
  try {
    const jsonText = JSON.parse(literal) as string;
    const data = JSON.parse(jsonText) as AppleHydration;
    const search = data.loaderData?.search;
    if (Array.isArray(search)) {
      return { jobs: search, total: 0 };
    }
    const jobs = search?.searchResults ?? [];
    const total = Number(search?.totalRecords ?? 0);
    return { jobs, total };
  } catch {
    return { jobs: [], total: 0 };
  }
}

function locationOf(job: AppleJob): string {
  const loc = job.locations?.[0];
  return (
    loc?.name ||
    [loc?.city, loc?.countryName].filter(Boolean).join(", ") ||
    "United States"
  );
}

function toJob(job: AppleJob): NormalizedJob | null {
  const positionId = String(job.positionId || job.id || "");
  const title = (job.postingTitle ?? "").trim();
  if (!positionId || !title) return null;
  const slug = job.transformedPostingTitle || "";
  const url = slug
    ? `https://jobs.apple.com/en-us/details/${positionId}/${slug}`
    : `https://jobs.apple.com/en-us/details/${positionId}`;
  const location = locationOf(job);
  return enrichJob({
    id: hashId(["apple", positionId, title]),
    title,
    company: "Apple",
    location,
    remote: Boolean(job.homeOffice) || /remote/i.test(location),
    url,
    applyUrl: url,
    description: truncate(job.jobSummary || `${title} at Apple. ${location}`),
    source: "apple",
    sourceLabel: "Apple careers",
    postedAt: job.postDateInGMT || job.postingDate,
    ats: "other",
    atsJobId: positionId,
    featuredCompany: "apple",
  });
}

async function fetchApplePage(page: number): Promise<{
  jobs: AppleJob[];
  total: number;
}> {
  const html = await fetchBrowserText(
    `https://jobs.apple.com/en-us/search?location=united-states-USA&page=${page}`,
    16_000,
  );
  return parseHydration(html);
}

export async function fetchAppleJobs(maxPages = 20): Promise<NormalizedJob[]> {
  const first = await fetchApplePage(1);
  const collected: NormalizedJob[] = [];
  const seen = new Set<string>();

  const add = (rows: AppleJob[]) => {
    for (const row of rows) {
      const job = toJob(row);
      if (!job || seen.has(job.id)) continue;
      seen.add(job.id);
      collected.push(job);
    }
  };

  add(first.jobs);
  if (!first.jobs.length) return collected;

  const total =
    first.total > 0 ? first.total : Number.POSITIVE_INFINITY;
  const pagesNeeded = Math.min(
    maxPages,
    Number.isFinite(total) ? Math.ceil(total / 20) : maxPages,
  );

  const rest = Array.from({ length: Math.max(0, pagesNeeded - 1) }, (_, i) => i + 2);
  const concurrency = 6;
  for (let i = 0; i < rest.length && collected.length < total; i += concurrency) {
    const batch = rest.slice(i, i + concurrency);
    const pages = await Promise.all(
      batch.map((page) => fetchApplePage(page).catch(() => ({ jobs: [] as AppleJob[], total: 0 }))),
    );
    let empty = 0;
    for (const parsed of pages) {
      if (!parsed.jobs.length) empty += 1;
      add(parsed.jobs);
    }
    if (empty === pages.length) break;
  }

  return collected;
}
