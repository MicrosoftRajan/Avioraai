import {
  FEATURED_COMPANIES,
  countBoardJobs,
  fetchFeaturedCareerJobs,
  newestFirst,
  scrapeAndPersist,
} from "@/lib/find-job/featured";
import { enrichJob } from "@/lib/find-job/job-filters";
import { ingestCareerPages } from "@/lib/find-job/career-page";
import {
  isJobStoreStale,
  listScrapedJobs,
  upsertScrapedJobs,
} from "@/lib/find-job/job-store";
import { fetchAllJobSources } from "@/lib/find-job/job-sources";
import { dedupeJobs, rankJobs } from "@/lib/find-job/rank";
import type { NormalizedJob, ScoredJob } from "@/lib/find-job/types";
import { after, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type SearchBody = {
  targetTitles?: string;
  skills?: string;
  resumeText?: string;
  location?: string;
  remoteOnly?: boolean;
  careerPageUrls?: string;
  featuredOnly?: boolean;
};

function parseCareerUrls(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 8);
}

function scoreFeatured(
  jobs: NormalizedJob[],
  resumeText: string,
): ScoredJob[] {
  if (!resumeText.trim()) {
    return newestFirst(jobs).map((job) => ({ ...job, previewScore: 0 }));
  }
  const ranked = rankJobs(jobs, {
    targetTitles: "",
    skills: "",
    resumeText,
    remoteOnly: false,
    location: "",
  });
  const byId = new Map(ranked.map((j) => [j.id, j.previewScore]));
  return newestFirst(jobs).map((job) => ({
    ...job,
    previewScore: byId.get(job.id) ?? 0,
  }));
}

export async function GET(req: Request) {
  try {
    const fresh = new URL(req.url).searchParams.get("fresh") === "1";
    const featured = await fetchFeaturedCareerJobs({ fresh });
    if (!fresh && featured.jobs.length && isJobStoreStale(featured.scrapedAt)) {
      after(() => {
        void scrapeAndPersist().catch((error) => {
          console.error("find-job background scrape failed", error);
        });
      });
    }
    const jobs = scoreFeatured(featured.jobs, "");
    return NextResponse.json({
      jobs,
      totalFound: jobs.length,
      shown: jobs.length,
      sources: [
        ...FEATURED_COMPANIES.map((c) => c.label),
        "OpenAI",
        "Stripe",
        "RemoteOK",
        "Remotive",
        "Arbeitnow",
        "Himalayas",
        "Jobicy",
        "We Work Remotely",
        "Naukri",
        "LinkedIn",
      ],
      counts: featured.counts,
      companies: FEATURED_COMPANIES,
      featured: true,
      fromStore: featured.fromStore,
      storeBackend: featured.backend,
      fetchedAt: featured.scrapedAt ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("find-job GET failed", error);
    return NextResponse.json(
      {
        error: "Search failed.",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchBody;
    const targetTitles = (body.targetTitles ?? "").trim();
    const skills = (body.skills ?? "").trim();
    const resumeText = (body.resumeText ?? "").trim();
    const location = (body.location ?? "").trim();
    const remoteOnly = Boolean(body.remoteOnly);
    const careerUrls = parseCareerUrls(body.careerPageUrls ?? "");
    const featuredOnly = Boolean(body.featuredOnly);

    const query = [targetTitles, skills].filter(Boolean).join(" ");

    const [featured, aggregated, careerJobs, stored] = await Promise.all([
      fetchFeaturedCareerJobs({ fresh: true }),
      featuredOnly
        ? Promise.resolve([] as NormalizedJob[])
        : fetchAllJobSources({ query, location }),
      careerUrls.length
        ? ingestCareerPages(careerUrls, query)
        : Promise.resolve([] as NormalizedJob[]),
      listScrapedJobs(),
    ]);

    const scrapedNow = dedupeJobs([
      ...featured.jobs,
      ...careerJobs,
      ...aggregated,
    ]).map(enrichJob);
    const backend = await upsertScrapedJobs(scrapedNow);

    const merged = dedupeJobs([...scrapedNow, ...stored.jobs]).map(enrichJob);

    const featuredIds = new Set(featured.jobs.map((j) => j.id));
    const featuredList = merged.filter((j) => featuredIds.has(j.id) || j.featuredCompany);
    const otherList = merged.filter((j) => !featuredIds.has(j.id) && !j.featuredCompany);

    const scoredFeatured = scoreFeatured(featuredList, resumeText);
    const scoredOther = resumeText
      ? rankJobs(otherList, {
          targetTitles,
          skills,
          resumeText,
          remoteOnly,
          location,
        })
      : newestFirst(otherList).map((job) => ({ ...job, previewScore: 0 }));

    const jobs = [...scoredFeatured, ...scoredOther];
    const sources = [
      ...FEATURED_COMPANIES.map((c) => c.label),
      ...new Set(jobs.map((j) => j.sourceLabel)),
    ].filter((v, i, a) => a.indexOf(v) === i);

    return NextResponse.json({
      jobs,
      totalFound: merged.length,
      shown: jobs.length,
      sources,
      counts: countBoardJobs(jobs),
      companies: FEATURED_COMPANIES,
      careerPages: careerUrls.length,
      featured: true,
      fromStore: false,
      storeBackend: backend,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("find-job POST failed", error);
    return NextResponse.json(
      {
        error: "Search failed.",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 },
    );
  }
}
