import { fetchAmazonJobs } from "./amazon";
import {
  ASHBY_BOARDS,
  GREENHOUSE_BOARDS,
  LEVER_BOARDS,
} from "./career-boards";
import { fetchGoogleJobs } from "./google";
import { fetchJson, hashId, postedDate, settledValues, stripHtml, truncate } from "./http";
import { fetchLinkedInJobs } from "./linkedin";
import { fetchNaukriJobs } from "./naukri";
import { jobMatchesQuery } from "./rank";
import {
  fetchAllRemoteBoardJobs,
  fetchArbeitnow,
  fetchHimalayas,
  fetchJobicy,
  fetchRemoteOk,
  fetchRemotive,
  fetchWeWorkRemotely,
} from "./remote-boards";
import type { FeaturedCompanyId, NormalizedJob } from "./types";

export {
  fetchAllRemoteBoardJobs,
  fetchArbeitnow,
  fetchHimalayas,
  fetchJobicy,
  fetchRemoteOk,
  fetchRemotive,
  fetchWeWorkRemotely,
};

function pickRelevant(
  jobs: NormalizedJob[],
  query: string,
  limit: number,
): NormalizedJob[] {
  if (!query.trim()) return jobs.slice(0, limit);
  const matched = jobs.filter((j) => jobMatchesQuery(j, query));
  return (matched.length ? matched : jobs).slice(0, limit);
}

type GreenhouseList = {
  jobs?: {
    id: number;
    title: string;
    absolute_url: string;
    updated_at?: string;
    location?: { name?: string };
    content?: string;
  }[];
};

type LeverPosting = {
  id: string;
  text?: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
  categories?: { location?: string; commitment?: string };
  descriptionPlain?: string;
  description?: string;
};

type AshbyPosting = {
  id?: string;
  title?: string;
  jobUrl?: string;
  applyUrl?: string;
  departmentName?: string;
  locationName?: string;
  workplaceType?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  publishedDate?: string;
};

function looksRemote(location: string, extra = ""): boolean {
  return /remote|anywhere|distributed|work from home|wfh/i.test(
    `${location} ${extra}`,
  );
}


export async function fetchGreenhouseBoard(
  token: string,
  company: string,
  perBoard = 8,
  query = "",
  opts?: { includeContent?: boolean; featuredCompany?: FeaturedCompanyId },
): Promise<NormalizedJob[]> {
  const includeContent = opts?.includeContent !== false;
  const data = await fetchJson<GreenhouseList>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs${includeContent ? "?content=true" : ""}`,
  );
  const mapped = (data.jobs ?? []).slice(0, 120).map((j) => {
    const location = j.location?.name || "Unspecified";
    return {
      id: hashId(["greenhouse", token, String(j.id)]),
      title: j.title,
      company,
      location,
      remote: looksRemote(location),
      url: j.absolute_url,
      applyUrl: j.absolute_url,
      description: truncate(
        stripHtml(j.content ?? "") || `${j.title} at ${company}. ${location}`,
      ),
      source: "greenhouse" as const,
      sourceLabel: `${company} careers`,
      postedAt: j.updated_at,
      ats: "greenhouse" as const,
      atsBoard: token,
      atsJobId: String(j.id),
      featuredCompany: opts?.featuredCompany,
    };
  });
  return pickRelevant(mapped, query, Math.max(perBoard, 8));
}

export async function fetchGreenhouseJobDescription(
  board: string,
  jobId: string,
): Promise<string> {
  const data = await fetchJson<{ content?: string }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${encodeURIComponent(jobId)}`,
  );
  return truncate(stripHtml(data.content ?? ""), 12_000);
}

export async function fetchLeverBoard(
  token: string,
  company: string,
  perBoard = 8,
  query = "",
  opts?: { featuredCompany?: FeaturedCompanyId },
): Promise<NormalizedJob[]> {
  const rows = await fetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`,
    {},
    14_000,
  );
  const mapped = rows.slice(0, 120).map((j) => {
    const location = j.categories?.location || "Unspecified";
    const url = j.hostedUrl || j.applyUrl || "";
    return {
      id: hashId(["lever", token, j.id]),
      title: j.text ?? "Role",
      company,
      location,
      remote: looksRemote(location, j.categories?.commitment ?? ""),
      url,
      applyUrl: j.applyUrl || url,
      description: truncate(stripHtml(j.descriptionPlain || j.description || "")),
      source: "lever" as const,
      sourceLabel: `${company} careers`,
      postedAt: postedDate(j.createdAt),
      ats: "lever" as const,
      atsBoard: token,
      atsJobId: j.id,
      featuredCompany: opts?.featuredCompany,
    };
  });
  return pickRelevant(mapped, query, Math.max(perBoard, 8));
}

export async function fetchAshbyBoard(
  token: string,
  company: string,
  perBoard = 8,
  query = "",
  opts?: { featuredCompany?: FeaturedCompanyId },
): Promise<NormalizedJob[]> {
  const data = await fetchJson<{ jobs?: AshbyPosting[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`,
    {},
    14_000,
  );
  const mapped = (data.jobs ?? []).slice(0, 120).map((j) => {
    const location = j.locationName || j.workplaceType || "Unspecified";
    const url = j.jobUrl || j.applyUrl || "";
    return {
      id: hashId(["ashby", token, j.id ?? url]),
      title: j.title ?? "Role",
      company,
      location,
      remote: looksRemote(location, j.workplaceType ?? ""),
      url,
      applyUrl: j.applyUrl || url,
      description: truncate(
        stripHtml(j.descriptionPlain || j.descriptionHtml || ""),
      ),
      source: "ashby" as const,
      sourceLabel: `${company} careers`,
      postedAt: j.publishedDate,
      ats: "ashby" as const,
      atsBoard: token,
      atsJobId: j.id,
      featuredCompany: opts?.featuredCompany,
    };
  });
  return pickRelevant(mapped, query, Math.max(perBoard, 8));
}

export async function fetchJSearch(
  query: string,
  location: string,
): Promise<NormalizedJob[]> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key || !query.trim()) return [];
  const params = new URLSearchParams({
    query: `${query} ${location}`.trim(),
    num_pages: "1",
    page: "1",
  });
  const data = await fetchJson<{
    data?: {
      job_id?: string;
      job_title?: string;
      employer_name?: string;
      job_city?: string;
      job_country?: string;
      job_is_remote?: boolean;
      job_apply_link?: string;
      job_description?: string;
      job_posted_at_datetime_utc?: string;
    }[];
  }>(`https://jsearch.p.rapidapi.com/search?${params.toString()}`, {
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    },
  });
  return (data.data ?? []).slice(0, 15).map((j) => {
    const loc =
      [j.job_city, j.job_country].filter(Boolean).join(", ") || "Unspecified";
    const url = j.job_apply_link ?? "";
    return {
      id: hashId(["jsearch", j.job_id ?? url, j.job_title ?? ""]),
      title: j.job_title ?? "Role",
      company: j.employer_name ?? "Company",
      location: loc,
      remote: Boolean(j.job_is_remote) || looksRemote(loc),
      url,
      applyUrl: url,
      description: truncate(j.job_description ?? ""),
      source: "jsearch" as const,
      sourceLabel: "Job boards",
      postedAt: j.job_posted_at_datetime_utc,
      ats: "other" as const,
    };
  });
}

export async function fetchAdzuna(
  query: string,
  location: string,
): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey || !query.trim()) return [];
  const country = process.env.ADZUNA_COUNTRY || "us";
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "15",
    what: query.slice(0, 80),
    where: location.slice(0, 80),
    content: "1",
  });
  const data = await fetchJson<{
    results?: {
      id?: string;
      title?: string;
      company?: { display_name?: string };
      location?: { display_name?: string };
      redirect_url?: string;
      description?: string;
      created?: string;
    }[];
  }>(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`,
  );
  return (data.results ?? []).map((j) => {
    const loc = j.location?.display_name || "Unspecified";
    const url = j.redirect_url ?? "";
    return {
      id: hashId(["adzuna", String(j.id ?? url), j.title ?? ""]),
      title: j.title ?? "Role",
      company: j.company?.display_name ?? "Company",
      location: loc,
      remote: looksRemote(loc),
      url,
      applyUrl: url,
      description: truncate(stripHtml(j.description ?? "")),
      source: "adzuna" as const,
      sourceLabel: "Adzuna",
      postedAt: j.created,
      ats: "other" as const,
    };
  });
}

export function curatedBoardFetches(
  query: string,
  perBoard = 8,
  includeContent = true,
): Promise<NormalizedJob[]>[] {
  return [
    ...GREENHOUSE_BOARDS.map((b) =>
      fetchGreenhouseBoard(b.token, b.company, perBoard, query, {
        includeContent,
      }).catch(() => [] as NormalizedJob[]),
    ),
    ...LEVER_BOARDS.map((b) =>
      fetchLeverBoard(b.token, b.company, perBoard, query).catch(
        () => [] as NormalizedJob[],
      ),
    ),
    ...ASHBY_BOARDS.map((b) =>
      fetchAshbyBoard(b.token, b.company, perBoard, query).catch(
        () => [] as NormalizedJob[],
      ),
    ),
  ];
}

export async function fetchAllJobSources(input: {
  query: string;
  location: string;
}): Promise<NormalizedJob[]> {
  const query = input.query.trim();
  const batches = await Promise.allSettled([
    fetchAllRemoteBoardJobs().catch(() => [] as NormalizedJob[]),
    fetchJSearch(query, input.location).catch(() => [] as NormalizedJob[]),
    fetchAdzuna(query, input.location).catch(() => [] as NormalizedJob[]),
    fetchNaukriJobs({ query, limit: 150 }).catch(() => [] as NormalizedJob[]),
    fetchLinkedInJobs({
      query,
      location: input.location,
      pages: query ? 3 : 2,
    }).catch(() => [] as NormalizedJob[]),
    fetchAmazonJobs(4).catch(() => [] as NormalizedJob[]),
    fetchGoogleJobs(6).catch(() => [] as NormalizedJob[]),
    ...curatedBoardFetches(query),
  ]);
  return settledValues(batches).flat();
}
