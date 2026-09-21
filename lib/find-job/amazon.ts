import { fetchJson, hashId, truncate } from "./http";
import { enrichJob } from "./job-filters";
import type { NormalizedJob } from "./types";

type AmazonJob = {
  id?: string;
  id_icims?: string;
  title?: string;
  location?: string;
  city?: string;
  state?: string;
  country_code?: string;
  normalized_location?: string;
  job_path?: string;
  company_name?: string;
  description?: string;
  description_short?: string;
  posted_date?: string;
  job_category?: string;
  job_family?: string;
  job_schedule_type?: string;
};

type AmazonSearch = {
  hits?: number;
  jobs?: AmazonJob[];
};

function locationOf(job: AmazonJob): string {
  return (
    job.normalized_location ||
    job.location ||
    [job.city, job.state, job.country_code].filter(Boolean).join(", ") ||
    "Unspecified"
  );
}

function toJob(job: AmazonJob): NormalizedJob | null {
  const title = (job.title ?? "").trim();
  const path = job.job_path || "";
  const jobId = String(job.id_icims || job.id || path);
  if (!title || !jobId) return null;
  const url = path.startsWith("http")
    ? path
    : `https://www.amazon.jobs${path.startsWith("/") ? "" : "/"}${path || `/en/jobs/${jobId}`}`;
  const location = locationOf(job);
  const desc = job.description_short || job.description || `${title} at Amazon. ${location}`;
  return enrichJob({
    id: hashId(["amazon", jobId, title]),
    title,
    company: "Amazon",
    location,
    remote: /remote/i.test(location),
    url,
    applyUrl: url,
    description: truncate(desc),
    source: "amazon",
    sourceLabel: "Amazon jobs",
    postedAt: job.posted_date,
    ats: "other",
    atsJobId: jobId,
    tags: [job.job_category, job.job_family, job.job_schedule_type].filter(
      (v): v is string => Boolean(v),
    ),
    featuredCompany: "amazon",
  });
}

function amazonQuery(params: Record<string, string>): string {
  const search = new URLSearchParams({
    offset: params.offset ?? "0",
    result_limit: "100",
    sort: "recent",
  });
  if (params.base_query) search.set("base_query", params.base_query);
  if (params.category) search.append("category[]", params.category);
  return search.toString();
}

async function fetchAmazonPage(
  offset: number,
  params: Record<string, string>,
): Promise<AmazonSearch> {
  return fetchJson<AmazonSearch>(
    `https://www.amazon.jobs/en/search.json?${amazonQuery({ ...params, offset: String(offset) })}`,
    {},
    14_000,
  );
}

export async function fetchAmazonJobs(maxPages = 6): Promise<NormalizedJob[]> {
  const queries: Record<string, string>[] = [
    { category: "software-development" },
    { base_query: "software engineer" },
    { base_query: "data scientist" },
  ];
  const collected: NormalizedJob[] = [];
  const seen = new Set<string>();

  for (const params of queries) {
    const first = await fetchAmazonPage(0, params).catch(() => ({ jobs: [], hits: 0 }));
    const hits = Number(first.hits ?? 0);
    const pagesNeeded = Math.min(
      maxPages,
      Math.max(1, Math.ceil((hits || (first.jobs?.length ?? 0)) / 100)),
    );
    const pages = [first];
    const rest = Array.from({ length: pagesNeeded - 1 }, (_, i) => (i + 1) * 100);
    const extras = await Promise.all(
      rest.map((offset) =>
        fetchAmazonPage(offset, params).catch(() => ({ jobs: [] as AmazonJob[] })),
      ),
    );
    pages.push(...extras);
    for (const page of pages) {
      for (const row of page.jobs ?? []) {
        const job = toJob(row);
        if (!job || seen.has(job.id)) continue;
        seen.add(job.id);
        collected.push(job);
      }
    }
  }

  return collected;
}
