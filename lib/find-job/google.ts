import { fetchBrowserText, hashId, stripHtml, truncate } from "./http";
import { enrichJob } from "./job-filters";
import type { NormalizedJob } from "./types";

const BASE = "https://www.google.com/about/careers/applications";

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      if (word.toLowerCase() === "ios") return "iOS";
      if (word.toLowerCase() === "ai") return "AI";
      if (word.toLowerCase() === "ux") return "UX";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function locationNear(html: string, index: number): string {
  const before = stripHtml(html.slice(Math.max(0, index - 2200), index));
  const match = before.match(
    /Google\s+(.+?)(?:Minimum qualifications|Learn more|$)/i,
  );
  const raw = (match?.[1] ?? "").split(";")[0]?.trim() ?? "";
  const cleaned = raw.replace(/^[|\s]+/, "").replace(/\s+/g, " ").slice(0, 120);
  return cleaned || "Unspecified";
}

function parsePage(html: string): NormalizedJob[] {
  const jobs: NormalizedJob[] = [];
  const seen = new Set<string>();
  const re =
    /href="(jobs\/results\/(\d+)-([^"?]+))[^"]*"([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const path = m[1];
    const jobId = m[2];
    const slug = m[3] ?? "";
    const attrs = m[4] ?? "";
    if (!jobId || seen.has(jobId)) continue;
    seen.add(jobId);
    const aria =
      attrs.match(/aria-label="Learn more about ([^"]+)"/i)?.[1] ??
      html
        .slice(m.index, m.index + 400)
        .match(/aria-label="Learn more about ([^"]+)"/i)?.[1];
    const title = (aria || titleFromSlug(slug)).trim();
    if (!title) continue;
    const url = `${BASE}/${path}`;
    const location = locationNear(html, m.index);
    jobs.push(
      enrichJob({
        id: hashId(["google", jobId, title]),
        title,
        company: "Google",
        location,
        remote: /remote/i.test(location),
        url,
        applyUrl: url,
        description: truncate(`${title} at Google. ${location}`),
        source: "google",
        sourceLabel: "Google careers",
        ats: "other",
        atsJobId: jobId,
        featuredCompany: "google",
      }),
    );
  }
  return jobs;
}

async function fetchGooglePage(page: number): Promise<NormalizedJob[]> {
  const html = await fetchBrowserText(
    `${BASE}/jobs/results?page=${page}`,
    16_000,
  );
  return parsePage(html);
}

export async function fetchGoogleJobs(maxPages = 12): Promise<NormalizedJob[]> {
  const first = await fetchGooglePage(1);
  const collected: NormalizedJob[] = [...first];
  const seen = new Set(first.map((j) => j.id));
  if (!first.length) return collected;

  const rest = Array.from({ length: Math.max(0, maxPages - 1) }, (_, i) => i + 2);
  const concurrency = 6;
  for (let i = 0; i < rest.length; i += concurrency) {
    const batch = rest.slice(i, i + concurrency);
    const pages = await Promise.all(
      batch.map((page) => fetchGooglePage(page).catch(() => [] as NormalizedJob[])),
    );
    let empty = 0;
    for (const rows of pages) {
      if (!rows.length) empty += 1;
      for (const job of rows) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);
        collected.push(job);
      }
    }
    if (empty === pages.length) break;
  }
  return collected;
}
