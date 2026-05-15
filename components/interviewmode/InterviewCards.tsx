"use client";

import MockInterviewCard from "./MockInterviewCard";
import ResumeAnalysisCard from "./ResumeAnalysisCard";
import type { InterviewProfile } from "./types";
import { INTERVIEW_ROUND_OPTIONS } from "./types";
import { persistInterviewSessionMode } from "@/lib/actions/interview-mode.actions";
import {
  INTERVIEW_SESSION_KEY,
  type InterviewModeType,
} from "@/lib/interview-session-storage";
import { Backlight } from "@/components/ui/backlight";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { pickInterviewer } from "@/lib/interview-interviewer";
import { useCallback, useMemo, useState } from "react";

export default function InterviewCards({
  className,
  profile,
}: {
  className?: string;
  profile: InterviewProfile | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const interviewer = useMemo(() => {
    if (!profile || profile.roundStage === "screening") return null;
    try {
      const raw = sessionStorage.getItem(INTERVIEW_SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw) as {
          interviewerName?: string;
          interviewerTitle?: string;
          company?: string;
          roundStage?: string;
        };
        if (data.interviewerName && data.interviewerTitle) {
          return { name: data.interviewerName, title: data.interviewerTitle };
        }
      }
    } catch {
      /* noop */
    }
    const picked = pickInterviewer(profile.roundStage, profile.company);
    return { name: picked.name, title: picked.title };
  }, [profile]);

  const choose = useCallback(
    async (mode: InterviewModeType) => {
      if (busy) return;
      const raw = sessionStorage.getItem(INTERVIEW_SESSION_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const sid =
          typeof data.supabaseSessionId === "string"
            ? data.supabaseSessionId
            : undefined;
        setBusy(true);
        sessionStorage.setItem(
          INTERVIEW_SESSION_KEY,
          JSON.stringify({ ...data, mode }),
        );
        if (sid) {
          void persistInterviewSessionMode(sid, mode).then((r) => {
            if (!r.ok) {
              console.warn("[interview-mode] Failed to persist mode to Supabase");
            }
          });
        }
        router.push("/interview-mode/session");
      } catch {
        setBusy(false);
      }
    },
    [busy, router],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className={cn("w-full max-w-4xl", className)}
    >
      {profile ? (
        <p className="mb-6 px-1 text-center text-xs font-semibold leading-snug text-white/85 sm:mb-8 sm:text-sm">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
            <span>Ready when you are</span>
            <span className="text-white/60">·</span>
            <span className="text-white">{profile.name}</span>
            <span className="text-white/60">@</span>
            <span className="max-w-[min(100%,14rem)] truncate text-white sm:max-w-none">
              {profile.company}
            </span>
            <span className="text-white/60">·</span>
            <span className="text-white/90">{profile.durationMinutes} min</span>
            {interviewer ? (
              <>
                <span className="text-white/60">·</span>
                <span className="text-white/90">
                  with {interviewer.name}
                </span>
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      <p className="mb-4 px-2 text-center text-[0.65rem] font-bold uppercase leading-snug tracking-widest text-white/55 sm:px-0 sm:text-xs">
        {profile ? (
          <>
            Stage:{" "}
            <span className="text-white/90">
              {
                INTERVIEW_ROUND_OPTIONS.find((o) => o.value === profile.roundStage)
                  ?.label
              }
            </span>
            {" · "}
            {profile.roundStage === "technical"
              ? "Voice interview includes resume review + optional coding workspace."
              : profile.roundStage === "managerial"
                ? "Formal leadership dialogue — debrief highlights executive wording."
                : "HR-style screening — formal tone and structured feedback."}
          </>
        ) : (
          <>
            Pick one track — voice interview plus coaching notes after you finish.
          </>
        )}
      </p>

      <div className="relative isolate pt-2">
        <div
          className="pointer-events-none absolute left-1/2 top-[58%] z-0 w-[min(100%,560px)] max-w-none -translate-x-1/2 -translate-y-1/2 sm:w-[min(110%,640px)]"
          aria-hidden
        >
          <Backlight blur={36} className="relative mx-auto h-[min(240px,42vw)] w-full max-w-[560px] sm:h-[260px]">
            <div className="relative h-full w-full scale-110">
              <div
                className="absolute inset-0 rounded-[45%] bg-[radial-gradient(ellipse_85%_65%_at_50%_50%,rgba(253,224,71,0.55)_0%,rgba(192,132,252,0.42)_38%,rgba(99,102,241,0.35)_55%,transparent_78%)]"
              />
            </div>
          </Backlight>
        </div>

        <div className="relative z-10 grid gap-6 sm:grid-cols-2">
          <MockInterviewCard
            disabled={busy}
            onStart={() => choose("mock")}
          />
          <ResumeAnalysisCard
            disabled={busy}
            onOpenRoadmap={() => choose("roadmap")}
          />
        </div>
      </div>
    </motion.div>
  );
}
