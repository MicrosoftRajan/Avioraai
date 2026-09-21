import {
  fetchJson,
  fetchBrowserText,
  hashId,
  postedDate,
  settledValues,
  stripHtml,
  truncate,
  BROWSER_UA,
} from "./http";
import type { NormalizedJob } from "./types";

const ARBEITNOW_MAX_PAGES = 50;
const HIMALAYAS_MAX_PAGES = 80;
const JOBICY_MAX = 200;
const JSON_BROWSER = { headers: { "User-Agent": BROWSER_UA } };

const JOBICY_INDUSTRIES = [
  "business",
  "copywriting",
  "supporting",
  "marketing",
  "management",
  "design-multimedia",
  "data-science",
  "admin",
  "accounting-finance",
  "hr",
  "legal",
] as const;

type RemoteOkRow = {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  apply_url?: string;
  tags?: string[];
  date?: string | number;
  legal?: unknown;
};

type RemotiveJob = {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  description?: string;
  publication_date?: string;
  job_type?: string;
};

type ArbeitnowJob = {
  slug?: string;
  url?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  created_at?: string;
  remote?: boolean;
  tags?: string[];
};

type HimalayasJob = {
  title?: string;
  excerpt?: string;
  description?: string;
  companyName?: string;
  location?: string;
  locationRestrictions?: string[] | string;
  applicationLink?: string;
  guid?: string;
  pubDate?: string;
  categories?: string[];
};

type JobicyJob = {
  id?: number;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  jobGeo?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
};

function looksRemote(location: string, extra = ""): boolean {
  return /remote|anywhere|distributed|work from home|wfh/i.test(
    `${location} ${extra}`,
  );
}

function take<T>(rows: T[], limit?: number): T[] {
  if (limit == null || limit <= 0) return rows;
  return rows.slice(0, limit);
}

function locList(value?: string[] | string): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value?.trim() || "";
}

function rssField(block: string, name: string): string {
  const m = block.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"),
  );
  return stripHtml(
    (m?.[1] ?? "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .trim(),
  );
}

export async function fetchRemoteOk(limit?: number): Promise<NormalizedJob[]> {
  const rows = await fetchJson<RemoteOkRow[]>("https://remoteok.com/api", JSON_BROWSER, 22_000);
  const mapped = rows
    .filter((r) => r && !r.legal && r.position && r.company)
    .map((r) => {
      const url = r.url || r.apply_url || "";
      const location = r.location || "Remote";
      return {
        id: hashId(["remoteok", String(r.id ?? url), r.position ?? ""]),
        title: r.position ?? "Role",
        company: r.company ?? "Company",
        location,
        remote: true,
        url,
        applyUrl: r.apply_url || url,
        description: truncate(stripHtml(r.description ?? "")),
        source: "remoteok" as const,
        sourceLabel: "RemoteOK",
        postedAt: postedDate(r.date),
        ats: "other" as const,
        tags: r.tags,
      };
    });
  return take(mapped, limit);
}

export async function fetchRemotive(
  search = "",
  limit?: number,
): Promise<NormalizedJob[]> {
  const q = encodeURIComponent(search.slice(0, 80));
  const url = search.trim()
    ? `https://remotive.com/api/remote-jobs?search=${q}`
    : "https://remotive.com/api/remote-jobs";
  const data = await fetchJson<{ jobs?: RemotiveJob[] }>(url, {}, 22_000);
  const mapped = (data.jobs ?? []).map((j) => {
    const location = j.candidate_required_location || "Remote";
    const href = j.url ?? "";
    return {
      id: hashId(["remotive", String(j.id ?? href), j.title ?? ""]),
      title: j.title ?? "Role",
      company: j.company_name ?? "Company",
      location,
      remote: true,
      url: href,
      applyUrl: href,
      description: truncate(stripHtml(j.description ?? "")),
      source: "remotive" as const,
      sourceLabel: "Remotive",
      postedAt: j.publication_date,
      ats: "other" as const,
      tags: j.job_type ? [j.job_type] : [],
    };
  });
  return take(mapped, limit);
}

async function fetchArbeitnowPage(page: number): Promise<ArbeitnowJob[] | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await fetchJson<{ data?: ArbeitnowJob[] }>(
        `https://www.arbeitnow.com/api/job-board-api?page=${page}`,
        JSON_BROWSER,
        28_000,
      );
      return data.data ?? [];
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  return null;
}

export async function fetchArbeitnow(limit?: number): Promise<NormalizedJob[]> {
  const first = await fetchArbeitnowPage(1);
  const rows: ArbeitnowJob[] = [...(first ?? [])];
  const maxPages =
    limit != null && limit > 0
      ? Math.min(ARBEITNOW_MAX_PAGES, Math.ceil(limit / 100) + 1)
      : ARBEITNOW_MAX_PAGES;

  for (let page = 2; page <= maxPages; page++) {
    const batch = await fetchArbeitnowPage(page);
    if (batch?.length) rows.push(...batch);
    if (limit != null && rows.length >= limit) break;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  const mapped = rows.map((j) => {
    const href = j.url ?? "";
    const location = j.location || (j.remote ? "Remote" : "Unspecified");
    return {
      id: hashId(["arbeitnow", j.slug ?? href, j.title ?? ""]),
      title: j.title ?? "Role",
      company: j.company_name ?? "Company",
      location,
      remote: Boolean(j.remote) || looksRemote(location),
      url: href,
      applyUrl: href,
      description: truncate(stripHtml(j.description ?? "")),
      source: "arbeitnow" as const,
      sourceLabel: "Arbeitnow",
      postedAt: j.created_at,
      ats: "other" as const,
      tags: j.tags,
    };
  });
  return take(mapped, limit);
}

export async function fetchHimalayas(limit?: number): Promise<NormalizedJob[]> {
  const cap =
    limit != null && limit > 0 ? limit : HIMALAYAS_MAX_PAGES * 20;
  const mapped: NormalizedJob[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < HIMALAYAS_MAX_PAGES && mapped.length < cap; page++) {
    const params = new URLSearchParams({ limit: "20" });
    if (cursor) params.set("cursor", cursor);
    let data: { jobs?: HimalayasJob[]; nextCursor?: string };
    try {
      data = await fetchJson<{
        jobs?: HimalayasJob[];
        nextCursor?: string;
      }>(`https://himalayas.app/jobs/api?${params.toString()}`, JSON_BROWSER, 18_000);
    } catch {
      break;
    }
    const jobs = data.jobs ?? [];
    if (!jobs.length) break;
    for (const j of jobs) {
      const href = j.applicationLink || j.guid || "";
      const location =
        locList(j.locationRestrictions) || j.location || "Remote";
      mapped.push({
        id: hashId(["himalayas", href, j.title ?? ""]),
        title: j.title ?? "Role",
        company: j.companyName ?? "Company",
        location,
        remote: true,
        url: href,
        applyUrl: href,
        description: truncate(stripHtml(j.excerpt || j.description || "")),
        source: "himalayas",
        sourceLabel: "Himalayas",
        postedAt: j.pubDate,
        ats: "other",
        tags: j.categories,
      });
      if (mapped.length >= cap) break;
    }
    cursor = data.nextCursor;
    if (!cursor) break;
  }
  return mapped;
}

async function fetchJobicyFeed(
  extra: string,
  count = JOBICY_MAX,
): Promise<JobicyJob[]> {
  const url = `https://jobicy.com/api/v2/remote-jobs?count=${count}${extra ? `&${extra}` : ""}`;
  const data = await fetchJson<{ jobs?: JobicyJob[] }>(url, {}, 16_000);
  return data.jobs ?? [];
}

export async function fetchJobicy(
  search = "",
  limit?: number,
): Promise<NormalizedJob[]> {
  const tag = (search.split(/[,/]/)[0] ?? "").trim().slice(0, 40);
  const feeds = await Promise.allSettled([
    fetchJobicyFeed(tag ? `tag=${encodeURIComponent(tag)}` : "", JOBICY_MAX),
    ...JOBICY_INDUSTRIES.map((industry) =>
      fetchJobicyFeed(`industry=${industry}`, 100),
    ),
  ]);
  const seen = new Set<string>();
  const rows: JobicyJob[] = [];
  for (const batch of settledValues(feeds)) {
    for (const j of batch) {
      const key = String(j.id ?? j.url ?? j.jobTitle ?? "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push(j);
    }
  }
  const mapped = rows.map((j) => {
    const href = j.url ?? "";
    const location = j.jobGeo || "Remote";
    return {
      id: hashId(["jobicy", String(j.id ?? href), j.jobTitle ?? ""]),
      title: j.jobTitle ?? "Role",
      company: j.companyName ?? "Company",
      location,
      remote: looksRemote(location, "remote"),
      url: href,
      applyUrl: href,
      description: truncate(stripHtml(j.jobExcerpt || j.jobDescription || "")),
      source: "jobicy" as const,
      sourceLabel: "Jobicy",
      postedAt: j.pubDate,
      ats: "other" as const,
    };
  });
  return take(mapped, limit);
}

export async function fetchWeWorkRemotely(
  limit?: number,
): Promise<NormalizedJob[]> {
  const xml = await fetchBrowserText(
    "https://weworkremotely.com/remote-jobs.rss",
    22_000,
  );
  const blocks = xml.split(/<item>/i).slice(1);
  const mapped = blocks.map((block) => {
    const titleRaw = rssField(block, "title");
    const split = titleRaw.split(/:\s+/);
    const company = split.length > 1 ? split[0]!.trim() : "Company";
    const title = split.length > 1 ? split.slice(1).join(": ").trim() : titleRaw || "Role";
    const url = rssField(block, "link") || rssField(block, "guid");
    const location =
      [rssField(block, "region"), rssField(block, "country"), rssField(block, "state")]
        .filter(Boolean)
        .join(", ") || "Remote";
    const tags = rssField(block, "skills")
      .split(/[,/|]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const category = rssField(block, "category");
    return {
      id: hashId(["weworkremotely", url, title]),
      title,
      company,
      location,
      remote: true,
      url,
      applyUrl: url,
      description: truncate(rssField(block, "description")),
      source: "weworkremotely" as const,
      sourceLabel: "We Work Remotely",
      postedAt: postedDate(rssField(block, "pubDate")),
      ats: "other" as const,
      tags: category ? [category, ...tags] : tags,
    };
  });
  return take(mapped, limit);
}

export async function fetchAllRemoteBoardJobs(): Promise<NormalizedJob[]> {
  const batches = await Promise.allSettled([
    fetchRemoteOk(),
    fetchRemotive(),
    fetchArbeitnow(),
    fetchHimalayas(),
    fetchJobicy(),
    fetchWeWorkRemotely(),
  ]);
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of settledValues(batches).flat()) {
    const key = job.id || job.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}
