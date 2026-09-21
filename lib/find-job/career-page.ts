import {
  fetchAshbyBoard,
  fetchGreenhouseBoard,
  fetchLeverBoard,
} from "./job-sources";
import { fetchJson, fetchText, hashId, postedDate, stripHtml, truncate } from "./http";
import { enrichJob } from "./job-filters";
import type { NormalizedJob } from "./types";

export type CareerTarget =
  | { kind: "greenhouse"; token: string; company: string }
  | { kind: "lever"; token: string; company: string }
  | { kind: "ashby"; token: string; company: string }
  | { kind: "workday"; host: string; tenant: string; site: string; company: string };

function titleFromToken(token: string): string {
  return token
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseCareerUrl(raw: string): CareerTarget | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  const ghBoard =
    host.match(/^(?:job-)?boards(?:-api)?\.greenhouse\.io$/) ||
    host.endsWith(".greenhouse.io");
  if (ghBoard) {
    const parts = path.split("/").filter(Boolean);
    const token =
      parts[0] === "v1" && parts[1] === "boards"
        ? parts[2]
        : parts[0] === "embed"
          ? url.searchParams.get("for") ?? parts[1]
          : parts[0];
    if (token) {
      return { kind: "greenhouse", token, company: titleFromToken(token) };
    }
  }

  if (host === "jobs.lever.co" || host.endsWith(".lever.co")) {
    const token = path.split("/").filter(Boolean)[0];
    if (token) {
      return { kind: "lever", token, company: titleFromToken(token) };
    }
  }

  if (
    host === "jobs.ashbyhq.com" ||
    host.endsWith(".ashbyhq.com") ||
    host === "api.ashbyhq.com"
  ) {
    const parts = path.split("/").filter(Boolean);
    const token =
      parts[0] === "posting-api" && parts[1] === "job-board"
        ? parts[2]
        : parts[0];
    if (token) {
      return { kind: "ashby", token, company: titleFromToken(token) };
    }
  }

  const wd = host.match(/^([a-z0-9-]+)\.wd\d+\.myworkdayjobs\.com$/i);
  if (wd) {
    const tenant = wd[1];
    const site =
      path
        .split("/")
        .filter(Boolean)
        .find((p) => p !== "en-US" && p !== "en-GB") ?? "";
    if (tenant && site) {
      return {
        kind: "workday",
        host,
        tenant,
        site,
        company: titleFromToken(tenant),
      };
    }
  }

  return null;
}

function targetKey(t: CareerTarget): string {
  if (t.kind === "workday") return `workday:${t.host}:${t.site}`;
  return `${t.kind}:${t.token}`;
}

function extractFromHtml(html: string, pageUrl: string): CareerTarget[] {
  const found: CareerTarget[] = [];
  const add = (t: CareerTarget | null) => {
    if (!t) return;
    const key = targetKey(t);
    if (found.some((x) => targetKey(x) === key)) return;
    found.push(t);
  };

  const patterns: { re: RegExp; url: (m: RegExpExecArray) => string }[] = [
    {
      re: /boards\.greenhouse\.io\/([a-z0-9_-]+)/gi,
      url: (m) => `https://boards.greenhouse.io/${m[1]}`,
    },
    {
      re: /job-boards\.greenhouse\.io\/([a-z0-9_-]+)/gi,
      url: (m) => `https://job-boards.greenhouse.io/${m[1]}`,
    },
    {
      re: /greenhouse\.io\/embed\/job_board\?for=([a-z0-9_-]+)/gi,
      url: (m) => `https://boards.greenhouse.io/${m[1]}`,
    },
    {
      re: /jobs\.lever\.co\/([a-z0-9_-]+)/gi,
      url: (m) => `https://jobs.lever.co/${m[1]}`,
    },
    {
      re: /jobs\.ashbyhq\.com\/([a-z0-9_-]+)/gi,
      url: (m) => `https://jobs.ashbyhq.com/${m[1]}`,
    },
  ];
  for (const { re, url } of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      add(parseCareerUrl(url(m)));
    }
  }

  const ldBlocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (ldBlocks) {
    for (const block of ldBlocks) {
      const json = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
      try {
        const data = JSON.parse(json) as { "@type"?: string; url?: string };
        const type = String(data["@type"] ?? "");
        if (type.includes("JobPosting") && data.url) {
          add(parseCareerUrl(data.url));
        }
      } catch {
        /* ignore malformed JSON-LD */
      }
    }
  }

  if (!found.length) {
    add(parseCareerUrl(pageUrl));
  }
  return found;
}

type WorkdayHit = {
  title?: string | { raw?: string };
  externalPath?: string;
  locationsText?: string;
  postedOn?: string | number | { dateTime?: string; date?: string };
  remoteType?: string;
  bulletFields?: string[];
};

function workdayTitle(title: WorkdayHit["title"]): string {
  if (!title) return "Role";
  if (typeof title === "string") return title;
  return title.raw || "Role";
}

function mapWorkdayJob(
  target: Extract<CareerTarget, { kind: "workday" }>,
  j: WorkdayHit,
  featuredCompany?: NormalizedJob["featuredCompany"],
): NormalizedJob {
  const path = j.externalPath ?? "";
  const url = path.startsWith("http")
    ? path
    : `https://${target.host}/${target.site}${path.startsWith("/") ? "" : "/"}${path}`;
  const location = j.locationsText || "Unspecified";
  const title = workdayTitle(j.title);
  const remote = /remote/i.test(`${location} ${j.remoteType ?? ""}`);
  const posted = postedDate(
    typeof j.postedOn === "object"
      ? j.postedOn?.dateTime || j.postedOn?.date
      : j.postedOn,
  );
  const mapped: NormalizedJob = {
    id: hashId(["workday", target.tenant, path, title]),
    title,
    company: target.company,
    location,
    remote,
    url,
    applyUrl: url,
    description: truncate(
      `${title} at ${target.company}. ${location}${posted ? `. ${posted}` : ""}`,
    ),
    source: "workday",
    sourceLabel: `${target.company} careers`,
    postedAt: posted,
    ats: "workday",
    atsBoard: target.site,
    atsJobId: path,
    tags: j.bulletFields,
    featuredCompany,
  };
  return enrichJob(mapped);
}

type WorkdayList = { total?: number; jobPostings?: WorkdayHit[] };

async function fetchWorkdayPage(
  endpoint: string,
  searchText: string,
  offset: number,
  pageSize: number,
): Promise<WorkdayList> {
  return fetchJson<WorkdayList>(
    endpoint,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appliedFacets: {},
        limit: pageSize,
        offset,
        searchText: searchText.slice(0, 80),
      }),
    },
    12_000,
  );
}

/** Workday list API only returns 20 rows per request. Paginate to collect the board. */
export async function fetchWorkdayJobs(
  target: Extract<CareerTarget, { kind: "workday" }>,
  searchText: string,
  opts?: { maxPages?: number; featuredCompany?: NormalizedJob["featuredCompany"] },
): Promise<NormalizedJob[]> {
  const endpoint = `https://${target.host}/wday/cxs/${target.tenant}/${target.site}/jobs`;
  const pageSize = 20;
  const maxPages = opts?.maxPages ?? 8;
  const first = await fetchWorkdayPage(endpoint, searchText, 0, pageSize);
  const out: NormalizedJob[] = [];
  for (const j of first.jobPostings ?? []) {
    out.push(mapWorkdayJob(target, j, opts?.featuredCompany));
  }
  if (!out.length) return out;

  const total =
    typeof first.total === "number" && first.total > 0
      ? first.total
      : out.length;
  const pagesNeeded = Math.min(maxPages, Math.ceil(total / pageSize));
  const rest = Array.from({ length: Math.max(0, pagesNeeded - 1) }, (_, i) => i + 1);
  const concurrency = 8;

  for (let i = 0; i < rest.length; i += concurrency) {
    const batch = rest.slice(i, i + concurrency);
    const pages = await Promise.all(
      batch.map((page) =>
        fetchWorkdayPage(endpoint, searchText, page * pageSize, pageSize).catch(
          () => ({ jobPostings: [] as WorkdayHit[] }),
        ),
      ),
    );
    for (const data of pages) {
      for (const j of data.jobPostings ?? []) {
        out.push(mapWorkdayJob(target, j, opts?.featuredCompany));
      }
    }
  }

  return out;
}

async function jobsForTarget(
  target: CareerTarget,
  query: string,
): Promise<NormalizedJob[]> {
  if (target.kind === "greenhouse") {
    return (await fetchGreenhouseBoard(target.token, target.company, 24, query)).map(
      enrichJob,
    );
  }
  if (target.kind === "lever") {
    return (await fetchLeverBoard(target.token, target.company, 24, query)).map(
      enrichJob,
    );
  }
  if (target.kind === "ashby") {
    return (await fetchAshbyBoard(target.token, target.company, 24, query)).map(
      enrichJob,
    );
  }
  return fetchWorkdayJobs(target, query, { maxPages: query.trim() ? 8 : 40 });
}

function jsonLdJobs(html: string, pageUrl: string): NormalizedJob[] {
  const jobs: NormalizedJob[] = [];
  const ldBlocks = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!ldBlocks) return jobs;
  for (const block of ldBlocks) {
    const json = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
    try {
      const parsed = JSON.parse(json) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const data = item as {
          "@type"?: string | string[];
          title?: string;
          name?: string;
          description?: string;
          url?: string;
          hiringOrganization?: { name?: string };
          jobLocation?: { address?: { addressLocality?: string } };
        };
        const type = Array.isArray(data["@type"])
          ? data["@type"].join(" ")
          : String(data["@type"] ?? "");
        if (!type.includes("JobPosting")) continue;
        const title = data.title || data.name;
        const url = data.url || pageUrl;
        if (!title || !url) continue;
        const company = data.hiringOrganization?.name || "Company";
        const location =
          data.jobLocation?.address?.addressLocality || "Unspecified";
        jobs.push({
          id: hashId(["jsonld", url, title]),
          title,
          company,
          location,
          remote: /remote/i.test(`${location} ${data.description ?? ""}`),
          url,
          applyUrl: url,
          description: truncate(stripHtml(data.description ?? title)),
          source: "career_page",
          sourceLabel: `${company} career page`,
          ats: "other",
        });
      }
    } catch {
      /* skip */
    }
  }
  return jobs;
}

export async function ingestCareerPages(
  urls: string[],
  query: string,
): Promise<NormalizedJob[]> {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(
    0,
    8,
  );
  const collected: NormalizedJob[] = [];

  for (const raw of unique) {
    const direct = parseCareerUrl(raw);
    try {
      if (direct) {
        collected.push(...(await jobsForTarget(direct, query)));
        continue;
      }
      const html = await fetchText(raw, 9_000);
      const fromLd = jsonLdJobs(html, raw);
      collected.push(...fromLd);
      const targets = extractFromHtml(html, raw);
      for (const t of targets.slice(0, 3)) {
        try {
          collected.push(...(await jobsForTarget(t, query)));
        } catch {
          /* board may not be public */
        }
      }
    } catch {
      /* skip unreachable career page */
    }
  }

  return collected;
}
