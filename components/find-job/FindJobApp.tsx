"use client";

import AutoApplyAgent, {
  recordsFromEvents,
} from "@/components/find-job/AutoApplyAgent";
import FindJobProfileForm from "@/components/find-job/FindJobProfileForm";
import { Button } from "@/components/ui/button";
import {
  appendApplications,
  loadApplications,
  loadFindJobProfile,
  saveFindJobProfile,
} from "@/lib/find-job/profile-storage";
import {
  EXPERIENCE_FILTERS,
  enrichJob,
  jobMatchesBoard,
  jobMatchesCountry,
  jobMatchesExperience,
  jobPostingUrl,
  type ExperienceLevel,
} from "@/lib/find-job/job-filters";
import { downloadPlainResumePdf, slugFilePart } from "@/lib/find-job/resume-pdf";
import type {
  ApplicationRecord,
  ApplyEvent,
  FindJobProfile,
  JobBoardId,
  ScoredJob,
} from "@/lib/find-job/types";
import { cn } from "@/lib/utils";
import { Briefcase, ExternalLink, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const POLL_MS = 45_000;
const PAGE_SIZE = 40;

const COMPANY_FILTERS: { id: "all" | JobBoardId; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "microsoft", label: "Microsoft" },
  { id: "apple", label: "Apple" },
  { id: "amazon", label: "Amazon" },
  { id: "google", label: "Google" },
  { id: "nvidia", label: "NVIDIA" },
  { id: "adobe", label: "Adobe" },
  { id: "salesforce", label: "Salesforce" },
  { id: "intel", label: "Intel" },
  { id: "cisco", label: "Cisco" },
  { id: "disney", label: "Disney" },
  { id: "warnerbros", label: "Warner Bros" },
  { id: "wellsfargo", label: "Wells Fargo" },
  { id: "spglobal", label: "S&P Global" },
  { id: "samsung", label: "Samsung" },
  { id: "tech", label: "Tech boards" },
  { id: "remote", label: "Remote boards" },
  { id: "naukri", label: "Naukri" },
  { id: "linkedin", label: "LinkedIn" },
];

type SearchPayload = {
  jobs?: ScoredJob[];
  sources?: string[];
  totalFound?: number;
  counts?: Partial<Record<JobBoardId, number>>;
  error?: string;
  fetchedAt?: string;
  fromStore?: boolean;
  storeBackend?: "supabase" | "local";
};

export default function FindJobApp() {
  const [profile, setProfile] = useState<FindJobProfile | null>(null);
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<string[]>([]);
  const [counts, setCounts] = useState<Partial<Record<JobBoardId, number>>>(
    {},
  );
  const [companyFilter, setCompanyFilter] = useState<"all" | JobBoardId>(
    "all",
  );
  const [countryFilter, setCountryFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState<
    "all" | ExperienceLevel
  >("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [totalFound, setTotalFound] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formPending, setFormPending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [events, setEvents] = useState<ApplyEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);
  const [packets, setPackets] = useState<
    Record<
      string,
      { resume?: string; cover?: string; title?: string; company?: string }
    >
  >({});
  const [history, setHistory] = useState<ApplicationRecord[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [fromStore, setFromStore] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const mergeJobs = useCallback((incoming: ScoredJob[], markNew: boolean) => {
    setJobs((prev) => {
      const map = new Map(prev.map((j) => [j.id, j]));
      const fresh: string[] = [];
      for (const raw of incoming) {
        const job = enrichJob(raw);
        if (!map.has(job.id) && markNew && seenIdsRef.current.size > 0) {
          fresh.push(job.id);
        }
        map.set(job.id, job);
      }
      if (fresh.length) {
        setNewJobIds((ids) => {
          const next = new Set(ids);
          for (const id of fresh) next.add(id);
          return next;
        });
      }
      for (const job of incoming) seenIdsRef.current.add(job.id);
      const rank = (posted?: string) => {
        if (posted == null || posted === "") return 0;
        const value = typeof posted === "string" ? posted : String(posted);
        const t = Date.parse(value);
        if (!Number.isNaN(t)) return t;
        const lower = value.toLowerCase();
        if (lower.includes("today")) return Date.now();
        if (lower.includes("yesterday")) return Date.now() - 86_400_000;
        const days = lower.match(/posted\s+(\d+)\s+day/);
        if (days) return Date.now() - Number(days[1]) * 86_400_000;
        return 0;
      };
      return [...map.values()].sort((a, b) => rank(b.postedAt) - rank(a.postedAt));
    });
  }, []);

  const loadFeatured = useCallback(
    async (silent: boolean, fresh = !silent) => {
      if (!silent) setLoadingBoard(true);
      else setRefreshing(true);
      try {
        const res = await fetch(
          fresh ? "/api/find-job/search?fresh=1" : "/api/find-job/search",
          { cache: "no-store" },
        );
        const json = (await res.json()) as SearchPayload;
        if (!res.ok) throw new Error(json.error || "Could not load career pages");
        const list = json.jobs ?? [];
        mergeJobs(list, silent);
        setSources(json.sources ?? []);
        setCounts(json.counts ?? {});
        setTotalFound(json.totalFound ?? list.length);
        setFetchedAt(json.fetchedAt ?? new Date().toISOString());
        setFromStore(Boolean(json.fromStore));
        setSearchError(null);
      } catch (e) {
        if (!silent) {
          setSearchError(e instanceof Error ? e.message : "Search failed");
        }
      } finally {
        setLoadingBoard(false);
        setRefreshing(false);
      }
    },
    [mergeJobs],
  );

  useEffect(() => {
    setProfile(loadFindJobProfile());
    setHistory(loadApplications());
    void loadFeatured(false, false);
  }, [loadFeatured]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadFeatured(true);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadFeatured]);

  const scopedJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          jobMatchesCountry(j, countryFilter) &&
          jobMatchesExperience(j, experienceFilter),
      ),
    [jobs, countryFilter, experienceFilter],
  );

  const filteredJobs = useMemo(() => {
    if (companyFilter === "all") return scopedJobs;
    return scopedJobs.filter((j) => jobMatchesBoard(j, companyFilter));
  }, [scopedJobs, companyFilter]);

  const countryOptions = useMemo(() => {
    const map = new Map<string, number>();
    let remote = 0;
    for (const job of jobs) {
      if (job.remote || job.country === "Remote") remote += 1;
      const country = job.country || "Unspecified";
      if (country === "Remote") continue;
      map.set(country, (map.get(country) ?? 0) + 1);
    }
    return {
      remote,
      countries: [...map.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
      ),
    };
  }, [jobs]);

  const visibleJobs = filteredJobs.slice(0, visibleCount);

  const selectedJobs = useMemo(
    () => jobs.filter((j) => selected.has(j.id)),
    [jobs, selected],
  );

  const handleProfile = useCallback(
    async (next: FindJobProfile) => {
      setFormPending(true);
      setSearchError(null);
      saveFindJobProfile(next);
      setProfile(next);
      try {
        const res = await fetch("/api/find-job/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetTitles: next.targetTitles,
            skills: next.skills,
            resumeText: next.resumeText,
            location: next.location,
            remoteOnly: next.remoteOnly,
            careerPageUrls: next.careerPageUrls,
          }),
        });
        const json = (await res.json()) as SearchPayload;
        if (!res.ok) throw new Error(json.error || "Search failed");
        const list = json.jobs ?? [];
        mergeJobs(list, false);
        setSources(json.sources ?? []);
        setCounts(json.counts ?? {});
        setTotalFound(json.totalFound ?? list.length);
        setFetchedAt(json.fetchedAt ?? new Date().toISOString());
        setFromStore(Boolean(json.fromStore));
        const auto = new Set(
          list
            .filter((j) => j.previewScore >= next.minFitScore)
            .slice(0, 8)
            .map((j) => j.id),
        );
        setSelected(
          auto.size ? auto : new Set(list.slice(0, 5).map((j) => j.id)),
        );
        setShowForm(false);
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setFormPending(false);
      }
    },
    [mergeJobs],
  );

  const toggleJob = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 12) next.add(id);
      return next;
    });
  };

  const startApply = async () => {
    if (!profile || !selectedJobs.length || running) return;
    setConfirmApply(false);
    setRunning(true);
    setEvents([]);
    const localPackets: typeof packets = {};
    try {
      const res = await fetch("/api/find-job/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, jobs: selectedJobs }),
      });
      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "Auto-apply failed to start");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      const collected: ApplyEvent[] = [];

      const consume = (chunk: string) => {
        const line = chunk.split("\n").find((l) => l.startsWith("data: "));
        if (!line) return;
        const ev = JSON.parse(line.slice(6)) as ApplyEvent;
        collected.push(ev);
        if (ev.jobId && (ev.alignedResume || ev.coverLetter)) {
          localPackets[ev.jobId] = {
            ...localPackets[ev.jobId],
            resume: ev.alignedResume ?? localPackets[ev.jobId]?.resume,
            cover: ev.coverLetter ?? localPackets[ev.jobId]?.cover,
            title: ev.title ?? localPackets[ev.jobId]?.title,
            company: ev.company ?? localPackets[ev.jobId]?.company,
          };
        }
        setPackets({ ...localPackets });
        setEvents([...collected]);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) consume(chunk);
      }
      if (buf.trim()) consume(buf);

      const jobMeta = new Map(
        selectedJobs.map((j) => [j.id, { title: j.title, company: j.company }]),
      );
      const withTitles = collected.map((ev) => {
        const meta = ev.jobId ? jobMeta.get(ev.jobId) : undefined;
        return {
          ...ev,
          title: ev.title ?? meta?.title,
          company: ev.company ?? meta?.company,
        };
      });
      setEvents(withTitles);
      const rows = recordsFromEvents(withTitles).map((r) => {
        const meta = jobMeta.get(r.jobId);
        const pack = localPackets[r.jobId];
        return {
          ...r,
          title: r.title === "Role" ? (meta?.title ?? r.title) : r.title,
          company:
            r.company === "Company" ? (meta?.company ?? r.company) : r.company,
          alignedResume: r.alignedResume ?? pack?.resume,
          coverLetter: r.coverLetter ?? pack?.cover,
        };
      });
      appendApplications(rows);
      setHistory(loadApplications());
    } catch (e) {
      setEvents((prev) => [
        ...prev,
        {
          type: "error",
          message: e instanceof Error ? e.message : "Auto-apply failed",
        },
        { type: "done", failed: selectedJobs.length, submitted: 0, ready: 0 },
      ]);
    } finally {
      setRunning(false);
    }
  };

  const downloadResume = (jobId: string) => {
    const pack = packets[jobId];
    const job = jobs.find((j) => j.id === jobId);
    const text = pack?.resume || profile?.resumeText;
    if (!text) return;
    const company = pack?.company || job?.company || "company";
    const title = pack?.title || job?.title || "role";
    downloadPlainResumePdf(
      text,
      `aviora-${slugFilePart(company)}-${slugFilePart(title)}-resume.pdf`,
    );
  };

  const copyCover = async (jobId: string) => {
    const text = packets[jobId]?.cover;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(jobId);
    window.setTimeout(() => setCopied(null), 1600);
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [companyFilter, countryFilter, experienceFilter]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8">
      <header className="rounded-2xl border-2 border-black bg-[#a5f3fc] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-neutral-700">
          Aviora · Find Job
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
          <Briefcase className="size-8 shrink-0" aria-hidden />
          Live career-page and job-board listings.
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-neutral-800 sm:text-base">
          Opening this page loads saved listings, then scrapes Microsoft, Apple,
          Amazon, Google, Wells Fargo, Adobe, Warner Bros. Discovery, S&P Global,
          Samsung, NVIDIA, Salesforce, Intel, Cisco, Disney, remote boards
          (RemoteOK, Remotive, Arbeitnow, Himalayas, Jobicy, We Work Remotely), plus Greenhouse /
          Lever / Ashby tech boards, Naukri, and LinkedIn. New postings are stored
          and show up automatically as they go live.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {COMPANY_FILTERS.map((c) => {
            if (c.id === "all") return null;
            const n = counts[c.id];
            return (
              <span
                key={c.id}
                className="rounded-full border-2 border-black bg-white px-3 py-1 text-[11px] font-black uppercase tracking-widest"
              >
                {c.label}
                {n != null ? ` · ${n}` : ""}
              </span>
            );
          })}
        </div>
      </header>

      {searchError ? (
        <p
          className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm font-bold text-red-900"
          role="alert"
        >
          {searchError}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">All open roles</h2>
              <p className="mt-1 text-sm font-medium text-neutral-600">
                {loadingBoard
                  ? "Loading saved listings…"
                  : `${filteredJobs.length} roles${companyFilter === "all" ? ` · ${totalFound} total` : ""}`}
                {fromStore && !loadingBoard ? " · from store" : ""}
                {refreshing ? " · checking for new jobs" : ""}
                {fetchedAt
                  ? ` · updated ${new Date(fetchedAt).toLocaleTimeString()}`
                  : ""}
                {selected.size ? ` · ${selected.size} selected` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-2 border-black font-bold"
                onClick={() => void loadFeatured(true, true)}
                disabled={loadingBoard || refreshing}
              >
                Refresh now
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-2 border-black font-bold"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? "Hide apply profile" : "Apply with resume"}
              </Button>
              <Button
                type="button"
                disabled={!selected.size || running || !profile}
                onClick={() => setConfirmApply(true)}
                className="border-2 border-black bg-neutral-950 font-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-neutral-800"
              >
                {running ? "Agent running…" : "Start auto-apply"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-700">
                Country
              </span>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="h-11 w-full rounded-xl border-2 border-black bg-white px-3 text-sm font-bold text-neutral-950"
              >
                <option value="all">All countries</option>
                <option value="remote">
                  Remote{countryOptions.remote ? ` · ${countryOptions.remote}` : ""}
                </option>
                {countryOptions.countries.map(([name, n]) => (
                  <option key={name} value={name}>
                    {name} · {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-black uppercase tracking-widest text-neutral-700">
                Experience
              </span>
              <select
                value={experienceFilter}
                onChange={(e) =>
                  setExperienceFilter(e.target.value as "all" | ExperienceLevel)
                }
                className="h-11 w-full rounded-xl border-2 border-black bg-white px-3 text-sm font-bold text-neutral-950"
              >
                {EXPERIENCE_FILTERS.map((opt) => {
                  const n =
                    opt.id === "all"
                      ? jobs.length
                      : jobs.filter((j) => jobMatchesExperience(j, opt.id))
                          .length;
                  return (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} · {n}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {COMPANY_FILTERS.map((c) => {
              const on = companyFilter === c.id;
              const n =
                c.id === "all"
                  ? scopedJobs.length
                  : scopedJobs.filter((j) =>
                      jobMatchesBoard(j, c.id as JobBoardId),
                    ).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompanyFilter(c.id)}
                  className={cn(
                    "rounded-full border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest",
                    on ? "bg-[#fde047]" : "bg-white hover:bg-neutral-100",
                  )}
                >
                  {c.label} · {n}
                </button>
              );
            })}
          </div>

          {showForm ? (
            <div className="mt-6">
              <FindJobProfileForm
                initial={profile}
                pending={formPending}
                onSubmit={handleProfile}
              />
            </div>
          ) : null}

          {confirmApply ? (
            <div
              className="mt-4 rounded-2xl border-2 border-black bg-[#fef9c3] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              role="dialog"
              aria-labelledby="fj-confirm-title"
            >
              <p id="fj-confirm-title" className="text-sm font-black">
                Apply to {selected.size} selected role
                {selected.size === 1 ? "" : "s"}?
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-800">
                {!profile
                  ? "Add your resume first (Apply with resume)."
                  : "Lever and Greenhouse public APIs may submit a real application. Other boards get a tailored packet plus the official apply link."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={!profile}
                  className="border-2 border-black bg-neutral-950 font-black text-white"
                  onClick={() => void startApply()}
                >
                  Yes, start agent
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black font-bold"
                  onClick={() => setConfirmApply(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {sources.length ? (
            <p className="mt-3 text-xs font-semibold text-neutral-500">
              Sources: {sources.slice(0, 12).join(" · ")}
              {sources.length > 12 ? "…" : ""}
            </p>
          ) : null}

          {loadingBoard && jobs.length === 0 ? (
            <p className="mt-8 flex items-center gap-2 rounded-2xl border-2 border-black bg-white p-6 font-semibold">
              <Search className="size-4 animate-pulse" />
              Scraping career pages, remote boards, Naukri, and LinkedIn…
            </p>
          ) : visibleJobs.length === 0 ? (
            <p className="mt-8 rounded-2xl border-2 border-black bg-white p-6 font-semibold">
              No roles match these filters. Try another country or experience
              level.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {visibleJobs.map((job) => {
                const on = selected.has(job.id);
                const isNew = newJobIds.has(job.id);
                const posting = jobPostingUrl(job);
                return (
                  <li key={job.id}>
                    <article
                      className={cn(
                        "rounded-2xl border-2 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]",
                        isNew
                          ? "bg-[#d9f99d]"
                          : on
                            ? "bg-[#fef9c3]"
                            : "bg-white",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-black text-neutral-950">
                            {job.title}
                          </p>
                          <p className="text-sm font-semibold text-neutral-700">
                            {job.company} · {job.location}
                            {job.remote ? " · Remote" : ""}
                            {job.country && job.country !== "Unspecified"
                              ? ` · ${job.country}`
                              : ""}
                            {job.postedAt ? ` · ${job.postedAt}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isNew ? (
                            <span className="rounded-full border-2 border-black bg-[#fde047] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                              New
                            </span>
                          ) : null}
                          {job.experienceLevel ? (
                            <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                              {job.experienceLevel}
                            </span>
                          ) : null}
                          <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                            {job.sourceLabel}
                          </span>
                          {job.previewScore > 0 ? (
                            <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-xs font-black text-white">
                              {job.previewScore}%
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {job.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                          {job.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={posting || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-neutral-950 px-3 py-2 text-xs font-black uppercase tracking-widest text-white",
                            posting
                              ? "hover:bg-neutral-800"
                              : "pointer-events-none opacity-40",
                          )}
                        >
                          Apply Directly
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                        <button
                          type="button"
                          onClick={() => toggleJob(job.id)}
                          className="rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-widest hover:bg-neutral-100"
                        >
                          {on ? "Selected" : "Select"}
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          {visibleCount < filteredJobs.length ? (
            <Button
              type="button"
              variant="outline"
              className="mt-6 w-full border-2 border-black font-black"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            >
              Show more ({filteredJobs.length - visibleCount} remaining)
            </Button>
          ) : null}
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border-2 border-black bg-[#fde047] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase tracking-widest">
              Live board
            </p>
            <p className="mt-2 text-sm font-semibold text-neutral-900">
              Career pages refresh every 45 seconds. New jobs get a New badge
              at the top of the list.
            </p>
          </div>
          <AutoApplyAgent
            events={events}
            running={running}
            onDownloadResume={downloadResume}
            onCopyCover={(id) => void copyCover(id)}
          />
          {copied ? (
            <p className="text-xs font-bold text-emerald-800">
              Cover letter copied.
            </p>
          ) : null}
          {history.length ? (
            <div className="rounded-2xl border-2 border-black bg-white p-4">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                Recent applications
              </p>
              <ul className="mt-2 space-y-2 text-sm font-semibold">
                {history.slice(0, 5).map((h) => (
                  <li key={`${h.jobId}-${h.at}`}>
                    {h.company} · {h.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
