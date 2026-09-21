import { fetchMaybeGzipText, hashId, truncate } from "./http";
import { enrichJob, experienceFromYears } from "./job-filters";
import type { NormalizedJob } from "./types";

const LATEST_SITEMAP =
  "https://www.naukri.com/sitemap/sitemap-latest-jd-pages-1.xml.gz";

const TITLE_TOKENS = new Set([
  "analyst",
  "architect",
  "assistant",
  "associate",
  "backend",
  "consultant",
  "coordinator",
  "data",
  "designer",
  "developer",
  "devops",
  "director",
  "engineer",
  "engineering",
  "executive",
  "frontend",
  "fullstack",
  "head",
  "hr",
  "intern",
  "internship",
  "junior",
  "lead",
  "manager",
  "officer",
  "operations",
  "product",
  "programmer",
  "project",
  "qa",
  "recruiter",
  "sales",
  "scientist",
  "senior",
  "software",
  "specialist",
  "sr",
  "support",
  "technician",
  "tester",
  "trainee",
]);

const LOCATION_SUFFIXES = [
  "bangalore-rural",
  "hyderabad-secunderabad",
  "navi-mumbai",
  "new-delhi",
  "secunderabad",
  "visakhapatnam",
  "thiruvananthapuram",
  "bhubaneswar",
  "trivandrum",
  "coimbatore",
  "chandigarh",
  "ahmedabad",
  "gurugram",
  "gurgaon",
  "faridabad",
  "ghaziabad",
  "bengaluru",
  "bangalore",
  "hyderabad",
  "mumbai",
  "chennai",
  "kolkata",
  "noida",
  "delhi",
  "pune",
  "jaipur",
  "kochi",
  "cochin",
  "indore",
  "bhopal",
  "nagpur",
  "surat",
  "vadodara",
  "lucknow",
  "kanpur",
  "patna",
  "ranchi",
  "mysuru",
  "mysore",
  "mangalore",
  "hubli",
  "delhi-ncr",
  "ncr",
  "zirakpur",
  "panchkula",
  "mohali",
  "vijayawada",
  "remote",
  "india",
  "pan-india",
];

const URL_RE =
  /job-listings-(.+?)-(\d+)-to-(\d+)-years-(\d+)\/?$/i;

function titleCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(" ");
}

function peelLocations(slug: string): { rest: string; locations: string[] } {
  let rest = slug.toLowerCase();
  const locations: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const loc of LOCATION_SUFFIXES) {
      if (rest === loc || rest.endsWith(`-${loc}`)) {
        locations.unshift(titleCase(loc));
        rest = rest === loc ? "" : rest.slice(0, -(loc.length + 1));
        changed = true;
        break;
      }
    }
  }
  return { rest, locations };
}

function splitTitleCompany(slug: string): { title: string; company: string } {
  const tokens = slug.split("-").filter(Boolean);
  if (tokens.length < 2) {
    return { title: titleCase(slug) || "Naukri role", company: "Naukri listing" };
  }
  const company: string[] = [];
  while (tokens.length > 1 && company.length < 3) {
    const last = tokens[tokens.length - 1]!;
    if (TITLE_TOKENS.has(last)) break;
    company.unshift(tokens.pop()!);
  }
  return {
    title: titleCase(tokens.join("-")) || "Naukri role",
    company: titleCase(company.join("-")) || "Naukri listing",
  };
}

function postedFromJobId(id: string): string | undefined {
  if (id.length < 6) return undefined;
  const dd = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const yy = Number(id.slice(4, 6));
  if (
    !Number.isFinite(dd) ||
    !Number.isFinite(mm) ||
    !Number.isFinite(yy) ||
    dd < 1 ||
    dd > 31 ||
    mm < 1 ||
    mm > 12 ||
    yy < 10 ||
    yy > 35
  ) {
    return undefined;
  }
  const d = new Date(Date.UTC(2000 + yy, mm - 1, dd));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function parseListing(loc: string): NormalizedJob | null {
  const path = loc.replace(/\/+$/, "").split("/").pop() ?? "";
  const match = path.match(URL_RE);
  if (!match) return null;
  const [, slug, minRaw, maxRaw, jobId] = match;
  if (!slug || !jobId) return null;
  const minExp = Number(minRaw);
  const maxExp = Number(maxRaw);
  const { rest, locations } = peelLocations(slug);
  const { title, company } = splitTitleCompany(rest);
  const location = locations.length ? locations.join(", ") : "India";
  const remote = /remote|work-from-home|wfh|pan-india/i.test(slug);
  const url = loc.split("?")[0] ?? loc;
  const years = `${minExp}-${maxExp} yrs`;
  return enrichJob({
    id: hashId(["naukri", jobId]),
    title,
    company,
    location,
    country: remote ? "Remote" : "India",
    experienceLevel: experienceFromYears(minExp, maxExp),
    remote,
    url,
    applyUrl: url,
    description: truncate(
      `${title} at ${company} · ${location} · ${years} · Naukri job ${jobId}`,
    ),
    source: "naukri",
    sourceLabel: "Naukri",
    postedAt: postedFromJobId(jobId),
    ats: "other",
    atsBoard: "naukri",
    atsJobId: jobId,
    tags: [years],
  });
}

function matchesQuery(job: NormalizedJob, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${job.title} ${job.company} ${job.location}`.toLowerCase();
  return q
    .split(/[\s,/]+/)
    .filter((t) => t.length > 2)
    .some((t) => hay.includes(t));
}

export async function fetchNaukriJobs(opts?: {
  query?: string;
  limit?: number;
}): Promise<NormalizedJob[]> {
  const limit = opts?.limit ?? 200;
  const xml = await fetchMaybeGzipText(LATEST_SITEMAP, 22_000);
  const jobs: NormalizedJob[] = [];
  const seen = new Set<string>();
  const block =
    /<url>\s*<loc>(.*?)<\/loc>\s*(?:<lastmod>(.*?)<\/lastmod>)?/g;
  let m: RegExpExecArray | null;
  while ((m = block.exec(xml))) {
    const job = parseListing(m[1] ?? "");
    if (!job || seen.has(job.id)) continue;
    const titleKey = `${job.company}|${job.title}`.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(titleKey)) continue;
    seen.add(job.id);
    seen.add(titleKey);
    jobs.push(job);
  }

  const query = opts?.query ?? "";
  const cutoff = Date.now() - 120 * 86_400_000;
  const dated = jobs.filter((j) => j.postedAt);
  const recent = dated.filter((j) => Date.parse(j.postedAt!) >= cutoff);
  const base = recent.length >= 40 ? recent : dated.length ? dated : jobs;
  const filtered = query ? base.filter((j) => matchesQuery(j, query)) : base;
  const pool = filtered.length ? filtered : base;
  pool.sort((a, b) => {
    const ta = a.postedAt ? Date.parse(a.postedAt) : 0;
    const tb = b.postedAt ? Date.parse(b.postedAt) : 0;
    return tb - ta;
  });
  return pool.slice(0, limit);
}
