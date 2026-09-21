"use client";

import { Button } from "@/components/ui/button";
import type { ApplicationRecord, ApplyEvent } from "@/lib/find-job/types";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type JobRow = {
  jobId: string;
  title: string;
  company: string;
  status: string;
  fitScore?: number;
  aligned?: boolean;
  message?: string;
  applyUrl?: string;
  method?: string;
};

export default function AutoApplyAgent({
  events,
  running,
  onDownloadResume,
  onCopyCover,
}: {
  events: ApplyEvent[];
  running: boolean;
  onDownloadResume: (jobId: string) => void;
  onCopyCover: (jobId: string) => void;
}) {
  const rows = useMemo(() => {
    const map = new Map<string, JobRow>();
    for (const ev of events) {
      if (!ev.jobId) continue;
      const prev = map.get(ev.jobId) ?? {
        jobId: ev.jobId,
        title: ev.title ?? "Role",
        company: ev.company ?? "Company",
        status: "queued",
      };
      if (ev.title) prev.title = ev.title;
      if (ev.company) prev.company = ev.company;
      if (ev.fitScore != null) prev.fitScore = ev.fitScore;
      if (ev.aligned != null) prev.aligned = ev.aligned;
      if (ev.message) prev.message = ev.message;
      if (ev.applyUrl) prev.applyUrl = ev.applyUrl;
      if (ev.method) prev.method = ev.method;
      prev.status = ev.type;
      map.set(ev.jobId, prev);
    }
    return [...map.values()];
  }, [events]);

  const done = events.find((e) => e.type === "done");
  const log = events.filter((e) => e.type !== "start");

  return (
    <section className="rounded-2xl border-2 border-black bg-neutral-950 p-5 text-white shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/50">
            Live agent
          </p>
          <h2 className="mt-1 text-lg font-black">
            {running ? "Auto-applying in real time" : "Agent run"}
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full border-2 px-3 py-1 text-xs font-black uppercase tracking-widest",
            running
              ? "animate-pulse border-emerald-300 bg-emerald-400 text-black"
              : "border-white/30 bg-white/10 text-white",
          )}
        >
          {running ? "Live" : "Idle"}
        </span>
      </div>

      {done ? (
        <p className="mt-3 text-sm font-semibold text-emerald-200">
          Done · {done.submitted ?? 0} submitted · {done.ready ?? 0} packets
          ready · {done.failed ?? 0} failed
        </p>
      ) : null}

      <ol className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1 font-mono text-[11px] leading-relaxed text-emerald-100/90">
        {log.length === 0 ? (
          <li className="text-white/50">Waiting for the first job…</li>
        ) : (
          log.slice(-40).map((ev, i) => (
            <li key={`${ev.type}-${ev.jobId ?? "x"}-${i}`}>
              <span className="text-white/40">{statusVerb(ev.type)}</span>{" "}
              {ev.company ? `${ev.company} · ` : ""}
              {ev.title ?? ev.message ?? ev.jobId ?? ""}
              {ev.fitScore != null ? ` · fit ${ev.fitScore}` : ""}
              {ev.aligned ? " · resume aligned" : ""}
            </li>
          ))
        )}
      </ol>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li
            key={row.jobId}
            className="rounded-xl border-2 border-white/20 bg-white/5 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black">{row.title}</p>
                <p className="text-xs font-semibold text-white/60">
                  {row.company}
                  {row.fitScore != null ? ` · ${row.fitScore}% fit` : ""}
                  {row.aligned ? " · resume rewritten" : ""}
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                {row.status.replace("_", " ")}
              </span>
            </div>
            {row.message ? (
              <p className="mt-2 text-xs text-white/70">{row.message}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {row.applyUrl ? (
                <Button
                  asChild
                  size="sm"
                  className="h-8 border-2 border-white bg-white font-bold text-black hover:bg-white/90"
                >
                  <a href={row.applyUrl} target="_blank" rel="noreferrer">
                    Open apply
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-2 border-white/40 bg-transparent text-white hover:bg-white/10"
                onClick={() => onDownloadResume(row.jobId)}
              >
                Resume PDF
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-2 border-white/40 bg-transparent text-white hover:bg-white/10"
                onClick={() => onCopyCover(row.jobId)}
              >
                Copy cover letter
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function recordsFromEvents(events: ApplyEvent[]): ApplicationRecord[] {
  const latest = new Map<string, ApplyEvent>();
  for (const ev of events) {
    if (ev.jobId) latest.set(ev.jobId, ev);
  }
  const rows: ApplicationRecord[] = [];
  for (const ev of latest.values()) {
    if (!ev.jobId) continue;
    if (
      ev.type !== "applied" &&
      ev.type !== "ready" &&
      ev.type !== "skipped" &&
      ev.type !== "error"
    ) {
      continue;
    }
    rows.push({
      jobId: ev.jobId,
      title: ev.title ?? "Role",
      company: ev.company ?? "Company",
      applyUrl: ev.applyUrl ?? "",
      status:
        ev.type === "applied"
          ? "submitted"
          : ev.type === "ready"
            ? "ready"
            : ev.type === "skipped"
              ? "skipped"
              : "failed",
      method: ev.method,
      fitScore: ev.fitScore ?? 0,
      aligned: Boolean(ev.aligned),
      alignedResume: ev.alignedResume,
      coverLetter: ev.coverLetter,
      message: ev.message,
      at: new Date().toISOString(),
    });
  }
  return rows;
}

function statusVerb(type: string): string {
  switch (type) {
    case "job_start":
      return "▶";
    case "score":
      return "score";
    case "aligning":
      return "aligning resume";
    case "aligned":
      return "aligned";
    case "applying":
      return "applying";
    case "applied":
      return "submitted";
    case "ready":
      return "packet ready";
    case "skipped":
      return "skipped";
    case "error":
      return "error";
    default:
      return type;
  }
}
