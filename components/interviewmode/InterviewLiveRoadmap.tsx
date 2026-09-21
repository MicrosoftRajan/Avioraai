"use client";

import type { LiveInterviewRoadmap } from "@/lib/interview-roadmap";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { Check, Circle, Flag, Radio } from "lucide-react";

function phaseIcon(status: LiveInterviewRoadmap["arc"][number]["status"]) {
  if (status === "done") return Check;
  if (status === "flagged") return Flag;
  if (status === "current") return Radio;
  return Circle;
}

export default function InterviewLiveRoadmap({
  roadmap,
  updating,
  callActive,
  aiEnhanced,
}: {
  roadmap: LiveInterviewRoadmap;
  updating?: boolean;
  callActive?: boolean;
  aiEnhanced?: boolean;
}) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border-2 border-black bg-white/90 p-5 shadow-[6px_6px_0_0_rgba(0,0,0,0.88)] backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-neutral-500">
            Interview roadmap
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest",
                callActive
                  ? "border-emerald-700 bg-emerald-100 text-emerald-900"
                  : "border-neutral-300 bg-neutral-50 text-neutral-500",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  callActive ? "animate-pulse bg-emerald-600" : "bg-neutral-400",
                )}
              />
              {callActive ? "Live" : "Standing by"}
            </span>
            {updating ? (
              <span className="rounded-full border border-amber-400 bg-amber-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-800">
                Updating
              </span>
            ) : null}
            {aiEnhanced ? (
              <span className="rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-violet-800">
                AI
              </span>
            ) : null}
          </p>
          <AnimatePresence mode="wait">
            <motion.h2
              key={roadmap.headline}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 max-w-2xl text-lg font-black tracking-tight text-neutral-900 sm:text-xl"
            >
              {roadmap.headline}
            </motion.h2>
          </AnimatePresence>
          <p className="mt-1 max-w-2xl text-sm font-medium text-neutral-600">
            {roadmap.coachingNote}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-black bg-[#fef9c3] px-4 py-3 text-center shadow-[3px_3px_0_0_#000]">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            Loop progress
          </p>
          <p className="font-mono text-2xl font-black tabular-nums text-neutral-900">
            {roadmap.progressPct}%
          </p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {roadmap.arc.map((phase, i) => {
          const Icon = phaseIcon(phase.status);
          return (
            <li key={phase.id} className="min-w-0">
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border-2 px-3 py-2.5 transition-colors",
                  phase.status === "current" &&
                    "border-black bg-[#fde047] shadow-[3px_3px_0_0_#000]",
                  phase.status === "done" && "border-emerald-800 bg-emerald-50",
                  phase.status === "flagged" &&
                    "border-black bg-[#fed7aa] shadow-[3px_3px_0_0_#000]",
                  phase.status === "upcoming" && "border-neutral-200 bg-neutral-50",
                )}
              >
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <Icon
                    className={cn(
                      "size-3.5",
                      phase.status === "current" || phase.status === "flagged"
                        ? "animate-pulse"
                        : "",
                    )}
                    strokeWidth={2.4}
                  />
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 text-sm font-black text-neutral-900">
                  {phase.label}
                </span>
                <span className="mt-0.5 line-clamp-2 text-[11px] font-medium text-neutral-600">
                  {phase.hint}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {roadmap.weeks.map((week) => (
          <motion.article
            layout
            key={week.id}
            className={cn(
              "rounded-xl border-2 border-black p-4",
              week.confidence === "grounded" && "bg-[#ecfeff] shadow-[3px_3px_0_0_#000]",
              week.confidence === "emerging" && "bg-[#fff7ed]",
              week.confidence === "seed" && "border-dashed bg-neutral-50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-black text-neutral-900">{week.title}</h3>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                  week.confidence === "grounded" &&
                    "border-cyan-800 bg-cyan-100 text-cyan-950",
                  week.confidence === "emerging" &&
                    "border-orange-700 bg-orange-100 text-orange-950",
                  week.confidence === "seed" &&
                    "border-neutral-300 bg-white text-neutral-500",
                )}
              >
                {week.confidence}
              </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-neutral-500">
              {week.reason}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-semibold leading-relaxed text-neutral-800">
              {week.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>

      {roadmap.signals.length || roadmap.topicsCovered.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {roadmap.signals.map((s) => (
            <span
              key={s}
              className="rounded-full border-2 border-black bg-[#fef08a] px-3 py-1 text-[11px] font-bold text-neutral-900"
            >
              {s}
            </span>
          ))}
          {roadmap.topicsCovered.map((t) => (
            <span
              key={t}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-[11px] font-bold capitalize text-neutral-700"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
