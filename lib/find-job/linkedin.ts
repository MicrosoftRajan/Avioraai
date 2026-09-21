import { fetchBrowserText, hashId, stripHtml, truncate } from "./http";
import { enrichJob } from "./job-filters";
import type { NormalizedJob } from "./types";

const SEARCH =
  "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

const DEFAULT_SEARCHES: { keywords: string; location: string }[] = [
  { keywords: "software engineer", location: "India" },
  { keywords: "software engineer", location: "United States" },
  { keywords: "software developer", location: "United Kingdom" },
  { keywords: "data analyst", location: "India" },
  { keywords: "data analyst", location: "United States" },
  { keywords: "product manager", location: "India" },
  { keywords: "product manager", location: "United States" },
  { keywords: "", location: "India" },
  { keywords: "", location: "United States" },
];

function decode(text: string): string {
  return stripHtml(text.replace(/&amp;/g, "&"));
}

function parseCards(html: string): NormalizedJob[] {
  const chunks = html.split(/data-entity-urn="urn:li:jobPosting:/).slice(1);
  const jobs: NormalizedJob[] = [];
  for (const chunk of chunks) {
    const id = chunk.match(/^(\d+)/)?.[1];
    if (!id) continue;
    const hrefRaw =
      chunk.match(/href="(https?:\/\/[^"]*\/jobs\/view\/[^"]+)"/i)?.[1] ?? "";
    const href = decode(hrefRaw).split("?")[0] ?? "";
    const title = decode(
      chunk.match(/base-search-card__title"[^>]*>\s*([^<]+)/i)?.[1] ??
        chunk.match(/<span class="sr-only">\s*([^<]+)/i)?.[1] ??
        "",
    );
    const company = decode(
      chunk.match(/hidden-nested-link"[^>]*>\s*([^<]+)/i)?.[1] ??
        chunk.match(/base-search-card__subtitle"[^>]*>[\s\S]*?>\s*([^<]+)/i)?.[1] ??
        "LinkedIn company",
    );
    const location = decode(
      chunk.match(/job-search-card__location"[^>]*>\s*([^<]+)/i)?.[1] ??
        "Unspecified",
    );
    const datetime = chunk.match(/datetime="([^"]+)"/i)?.[1];
    const timeLabel = decode(chunk.match(/<time[^>]*>\s*([^<]+)/i)?.[1] ?? "");
    const postedAt = datetime || timeLabel || undefined;
    if (!title) continue;
    const url = href || `https://www.linkedin.com/jobs/view/${id}`;
    const remote = /remote|anywhere|distributed/i.test(`${location} ${title}`);
    jobs.push(
      enrichJob({
        id: hashId(["linkedin", id]),
        title,
        company,
        location,
        remote,
        url,
        applyUrl: `https://www.linkedin.com/jobs/view/${id}`,
        description: truncate(`${title} at ${company} · ${location}`),
        source: "linkedin",
        sourceLabel: "LinkedIn",
        postedAt,
        ats: "other",
        atsBoard: "linkedin",
        atsJobId: id,
      }),
    );
  }
  return jobs;
}

async function fetchPage(
  keywords: string,
  location: string,
  start: number,
  extra?: Record<string, string>,
): Promise<NormalizedJob[]> {
  const params = new URLSearchParams({
    location,
    start: String(start),
    sortBy: "DD",
    ...(extra ?? {}),
  });
  if (keywords.trim()) params.set("keywords", keywords.trim());
  const html = await fetchBrowserText(`${SEARCH}?${params.toString()}`, 12_000);
  return parseCards(html);
}

export async function fetchLinkedInJobs(opts?: {
  query?: string;
  location?: string;
  pages?: number;
  companyId?: string;
}): Promise<NormalizedJob[]> {
  const pages = opts?.pages ?? 2;
  const starts = Array.from({ length: pages }, (_, i) => i * 10);
  const extra = opts?.companyId ? { f_C: opts.companyId } : undefined;
  const searches = opts?.query?.trim()
    ? [
        {
          keywords: opts.query.trim(),
          location: opts.location?.trim() || "India",
        },
        { keywords: opts.query.trim(), location: "United States" },
        { keywords: opts.query.trim(), location: "United Kingdom" },
      ]
    : opts?.companyId
      ? [
          { keywords: "", location: "United States" },
          { keywords: "", location: "India" },
          { keywords: "", location: "United Kingdom" },
          { keywords: "software", location: "United States" },
        ]
      : DEFAULT_SEARCHES;

  const pagesJobs = await Promise.all(
    searches.flatMap((s) =>
      starts.map((start) =>
        fetchPage(s.keywords, s.location, start, extra).catch(
          () => [] as NormalizedJob[],
        ),
      ),
    ),
  );
  const seen = new Set<string>();
  const out: NormalizedJob[] = [];
  for (const job of pagesJobs.flat()) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  return out;
}
