import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { enrichJob } from "./job-filters";
import { isRemoteJobSource } from "./types";
import type {
  ExperienceLevel,
  FeaturedCompanyId,
  JobAts,
  JobSourceKind,
  NormalizedJob,
} from "./types";

export type JobStoreBackend = "supabase" | "local";

export type JobStoreSnapshot = {
  jobs: NormalizedJob[];
  scrapedAt: string | null;
  backend: JobStoreBackend;
};

const STALE_MS = 5 * 60 * 1000;
const RETAIN_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_LOCAL_JOBS = 25_000;
const UPSERT_CHUNK = 80;
const LIST_PAGE = 1_000;

type LocalRecord = NormalizedJob & {
  firstSeenAt: string;
  lastSeenAt: string;
};

type LocalDb = {
  jobs: Record<string, LocalRecord>;
};

type ScrapedJobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string | null;
  experience_level: string | null;
  remote: boolean;
  url: string;
  apply_url: string;
  description: string;
  source: string;
  source_label: string;
  posted_at: string | null;
  ats: string;
  ats_board: string | null;
  ats_job_id: string | null;
  tags: string[] | null;
  featured_company: string | null;
  last_seen_at: string;
};

let writeChain: Promise<unknown> = Promise.resolve();

function withLocalLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function localPath(): string {
  const root = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), ".data");
  return path.join(root, "scraped-jobs.json");
}

export function isFeaturedStoredJob(job: NormalizedJob): boolean {
  return (
    Boolean(job.featuredCompany) ||
    job.source === "naukri" ||
    job.source === "linkedin" ||
    job.source === "greenhouse" ||
    job.source === "lever" ||
    job.source === "ashby" ||
    job.source === "amazon" ||
    job.source === "google" ||
    isRemoteJobSource(job.source)
  );
}

export function isJobStoreStale(scrapedAt: string | null, now = Date.now()): boolean {
  if (!scrapedAt) return true;
  const t = Date.parse(scrapedAt);
  if (Number.isNaN(t)) return true;
  return now - t > STALE_MS;
}

function cutoffIso(now = Date.now()): string {
  return new Date(now - RETAIN_MS).toISOString();
}

function toRow(job: NormalizedJob, nowIso: string): Record<string, unknown> {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    country: job.country ?? null,
    experience_level: job.experienceLevel ?? null,
    remote: Boolean(job.remote),
    url: job.url,
    apply_url: job.applyUrl,
    description: job.description,
    source: job.source,
    source_label: job.sourceLabel,
    posted_at: job.postedAt ?? null,
    ats: job.ats,
    ats_board: job.atsBoard ?? null,
    ats_job_id: job.atsJobId ?? null,
    tags: job.tags?.length ? job.tags : null,
    featured_company: job.featuredCompany ?? null,
    last_seen_at: nowIso,
    updated_at: nowIso,
  };
}

function fromRow(row: ScrapedJobRow): NormalizedJob {
  return enrichJob({
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    country: row.country ?? undefined,
    experienceLevel: (row.experience_level as ExperienceLevel | null) ?? undefined,
    remote: Boolean(row.remote),
    url: row.url,
    applyUrl: row.apply_url,
    description: row.description ?? "",
    source: row.source as JobSourceKind,
    sourceLabel: row.source_label,
    postedAt: row.posted_at ?? undefined,
    ats: (row.ats as JobAts) || "other",
    atsBoard: row.ats_board ?? undefined,
    atsJobId: row.ats_job_id ?? undefined,
    tags: row.tags ?? undefined,
    featuredCompany: (row.featured_company as FeaturedCompanyId | null) ?? undefined,
  });
}

async function readLocalDb(): Promise<LocalDb> {
  try {
    const raw = await readFile(localPath(), "utf8");
    const parsed = JSON.parse(raw) as LocalDb;
    return {
      jobs:
        parsed.jobs && typeof parsed.jobs === "object" && !Array.isArray(parsed.jobs)
          ? parsed.jobs
          : {},
    };
  } catch {
    return { jobs: {} };
  }
}

async function writeLocalDb(db: LocalDb): Promise<void> {
  const file = localPath();
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db), "utf8");
  await rename(tmp, file);
}

function pruneLocal(db: LocalDb, now = Date.now()): LocalDb {
  const cutoff = now - RETAIN_MS;
  const kept = Object.values(db.jobs)
    .filter((job) => Date.parse(job.lastSeenAt) >= cutoff)
    .sort((a, b) => Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt))
    .slice(0, MAX_LOCAL_JOBS);
  const jobs: Record<string, LocalRecord> = {};
  for (const job of kept) jobs[job.id] = job;
  return { jobs };
}

function snapshotFromLocal(
  db: LocalDb,
  featuredOnly: boolean,
): JobStoreSnapshot {
  let records = Object.values(db.jobs);
  if (featuredOnly) records = records.filter(isFeaturedStoredJob);
  let scrapedAt: string | null = null;
  for (const job of records) {
    if (!scrapedAt || job.lastSeenAt > scrapedAt) scrapedAt = job.lastSeenAt;
  }
  return {
    jobs: records.map((job) => {
      const rest: NormalizedJob = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        experienceLevel: job.experienceLevel,
        remote: job.remote,
        url: job.url,
        applyUrl: job.applyUrl,
        description: job.description,
        source: job.source,
        sourceLabel: job.sourceLabel,
        postedAt: job.postedAt,
        ats: job.ats,
        atsBoard: job.atsBoard,
        atsJobId: job.atsJobId,
        tags: job.tags,
        featuredCompany: job.featuredCompany,
      };
      return enrichJob(rest);
    }),
    scrapedAt,
    backend: "local",
  };
}

async function upsertLocal(jobs: NormalizedJob[]): Promise<void> {
  if (!jobs.length) return;
  await withLocalLock(async () => {
    const db = pruneLocal(await readLocalDb());
    const nowIso = new Date().toISOString();
    for (const job of jobs) {
      const prev = db.jobs[job.id];
      db.jobs[job.id] = {
        ...enrichJob(job),
        firstSeenAt: prev?.firstSeenAt ?? nowIso,
        lastSeenAt: nowIso,
      };
    }
    await writeLocalDb(pruneLocal(db));
  });
}

async function listLocal(featuredOnly: boolean): Promise<JobStoreSnapshot> {
  const db = pruneLocal(await readLocalDb());
  return snapshotFromLocal(db, featuredOnly);
}

async function upsertSupabase(jobs: NormalizedJob[]): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin || !jobs.length) return Boolean(admin);
  const nowIso = new Date().toISOString();
  for (let i = 0; i < jobs.length; i += UPSERT_CHUNK) {
    const chunk = jobs.slice(i, i + UPSERT_CHUNK).map((job) => toRow(job, nowIso));
    const { error } = await admin.from("scraped_jobs").upsert(chunk, {
      onConflict: "id",
    });
    if (error) {
      console.error("[find-job] scraped_jobs upsert:", error.message);
      return false;
    }
  }
  const { error: pruneError } = await admin
    .from("scraped_jobs")
    .delete()
    .lt("last_seen_at", cutoffIso());
  if (pruneError) {
    console.error("[find-job] scraped_jobs prune:", pruneError.message);
  }
  return true;
}

async function listSupabase(featuredOnly: boolean): Promise<JobStoreSnapshot | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const jobs: NormalizedJob[] = [];
  let scrapedAt: string | null = null;
  let from = 0;

  while (true) {
    let query = admin
      .from("scraped_jobs")
      .select(
        "id,title,company,location,country,experience_level,remote,url,apply_url,description,source,source_label,posted_at,ats,ats_board,ats_job_id,tags,featured_company,last_seen_at",
      )
      .gte("last_seen_at", cutoffIso())
      .order("last_seen_at", { ascending: false })
      .range(from, from + LIST_PAGE - 1);

    if (featuredOnly) {
      query = query.or(
        "featured_company.not.is.null,source.in.(naukri,linkedin,greenhouse,lever,ashby,amazon,google,remoteok,remotive,arbeitnow,himalayas,jobicy,weworkremotely)",
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("[find-job] scraped_jobs list:", error.message);
      return null;
    }
    const rows = (data ?? []) as ScrapedJobRow[];
    for (const row of rows) {
      jobs.push(fromRow(row));
      if (!scrapedAt || row.last_seen_at > scrapedAt) scrapedAt = row.last_seen_at;
    }
    if (rows.length < LIST_PAGE) break;
    from += LIST_PAGE;
  }

  return { jobs, scrapedAt, backend: "supabase" };
}

export async function upsertScrapedJobs(jobs: NormalizedJob[]): Promise<JobStoreBackend> {
  if (!jobs.length) {
    return createSupabaseAdminClient() ? "supabase" : "local";
  }
  const wroteSupabase = await upsertSupabase(jobs);
  if (wroteSupabase && createSupabaseAdminClient()) return "supabase";
  await upsertLocal(jobs);
  return "local";
}

export async function listScrapedJobs(opts?: {
  featuredOnly?: boolean;
}): Promise<JobStoreSnapshot> {
  const featuredOnly = Boolean(opts?.featuredOnly);
  const fromSupabase = await listSupabase(featuredOnly);
  if (fromSupabase) return fromSupabase;
  return listLocal(featuredOnly);
}
