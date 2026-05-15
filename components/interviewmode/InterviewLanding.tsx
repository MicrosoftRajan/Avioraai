"use client";

import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { PulsatingButton } from "@/components/ui/pulsating-button";
import { KineticText } from "@/components/ui/kinetic-text";
import { Ripple } from "@/components/ui/ripple";
import { WordRotate } from "@/components/ui/word-rotate";
import InterviewCards from "./InterviewCards";
import InterviewForm from "./InterviewForm";
import SetupEnvironment from "./SetupEnvironment";
import type { InterviewProfile } from "./types";
import { persistInterviewSessionStart } from "@/lib/actions/interview-mode.actions";
import { pickInterviewer } from "@/lib/interview-interviewer";
import { INTERVIEW_SESSION_KEY } from "@/lib/interview-session-storage";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";

type Step = "activate" | "intro" | "form" | "setup" | "cards";

const SETUP_MS = 2800;

/** Rotate phrases then intro (~duration × word count + buffer). */
const ACTIVATE_WORD_MS = 1500;
const ACTIVATE_HOLD_AFTER_MS = 700;
const ACTIVATE_WORDS = [
  "Interview Mode",
  "Activated",
  "Interview Mode Activated",
] as const;
const ACTIVATE_TOTAL_MS =
  ACTIVATE_WORD_MS * ACTIVATE_WORDS.length + ACTIVATE_HOLD_AFTER_MS;

const RIPPLE_STEPS: Step[] = ["form", "setup", "cards"];

export default function InterviewLanding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [profile, setProfile] = useState<InterviewProfile | null>(null);
  const setupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activateTimerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("activate") === "1") {
      setStep("activate");
    }
  }, []);

  useEffect(() => {
    if (step !== "activate") return;
    if (activateTimerRef.current) clearTimeout(activateTimerRef.current);
    activateTimerRef.current = window.setTimeout(() => {
      activateTimerRef.current = null;
      router.replace("/interview-mode", { scroll: false });
      setStep("intro");
    }, ACTIVATE_TOTAL_MS);
    return () => {
      if (activateTimerRef.current) clearTimeout(activateTimerRef.current);
    };
  }, [step, router]);

  const handleFormSubmit = useCallback(
    async (data: InterviewProfile) => {
      setProfile(data);
      let supabaseSessionId: string | undefined;

      const interviewer =
        data.roundStage === "screening"
          ? null
          : pickInterviewer(data.roundStage, data.company);

      const sessionPayload = {
        name: data.name,
        company: data.company,
        resumeText: data.resumeText,
        resumeFileName: data.resumeFile?.name ?? "resume",
        durationMinutes: data.durationMinutes,
        roundStage: data.roundStage,
        ...(interviewer
          ? {
              interviewerName: interviewer.name,
              interviewerTitle: interviewer.title,
            }
          : {}),
        ...(data.jobDescription?.trim()
          ? { jobDescription: data.jobDescription.trim() }
          : {}),
      };

      try {
        const saved = await persistInterviewSessionStart({
          name: data.name,
          company: data.company,
          resumeText: data.resumeText,
          resumeFileName: data.resumeFile?.name ?? "resume",
          durationMinutes: data.durationMinutes,
        });
        if (saved.ok && saved.id) supabaseSessionId = saved.id;
      } catch (err) {
        console.error("[interview-mode] Supabase persist failed:", err);
      }

      const stored = JSON.stringify({
        ...sessionPayload,
        ...(supabaseSessionId ? { supabaseSessionId } : {}),
      });

      if (data.roundStage === "screening") {
        sessionStorage.setItem(INTERVIEW_SESSION_KEY, stored);
        router.push("/interview-mode/screening");
        return;
      }

      sessionStorage.setItem(INTERVIEW_SESSION_KEY, stored);
      setStep("setup");
      if (setupTimerRef.current) clearTimeout(setupTimerRef.current);
      setupTimerRef.current = setTimeout(() => {
        setupTimerRef.current = null;
        setStep("cards");
      }, SETUP_MS);
    },
    [router],
  );

  useEffect(() => {
    return () => {
      if (setupTimerRef.current) clearTimeout(setupTimerRef.current);
    };
  }, []);

  const showRipple = RIPPLE_STEPS.includes(step);

  return (
    <BackgroundGradientAnimation
      containerClassName="min-h-[calc(max(100svh,100dvh)-5.25rem)] w-full min-w-0"
      interactive
      className="mx-auto w-full min-w-0 max-w-6xl flex-1 pb-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-6 sm:pl-8 sm:pr-8"
    >
      <div
        className={
          showRipple
            ? // Full-viewport glass: fixed height below navbar so tall forms scroll inside the panel (keyboard / small screens).
              "relative left-1/2 z-10 flex h-[calc(max(100svh,100dvh)-5.25rem)] min-h-0 w-[100dvw] min-w-0 max-w-[100dvw] shrink-0 -translate-x-1/2 flex-col overflow-x-clip overflow-y-auto overscroll-y-contain border border-white/15 bg-black/15 shadow-[inset_0_0_120px_rgba(255,255,255,0.07)] backdrop-blur-xl [scrollbar-gutter:stable]"
            : "relative z-10 w-full"
        }
      >
        {showRipple ? (
          <Ripple
            variant="on-dark"
            numCircles={10}
            mainCircleSize={190}
            mainCircleOpacity={0.26}
            className="mask-[linear-gradient(to_bottom,white_0%,white_55%,transparent_100%)]"
          />
        ) : null}
        <div className="relative z-10 min-h-0 min-w-0 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pt-2 sm:px-4 sm:pb-8 sm:pt-4">
      <AnimatePresence mode="wait">
        {step === "activate" ? (
          <motion.div
            key="activate"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-[min(60vh,520px)] flex-col items-center justify-center px-4 py-16 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.35em] text-white/55">
              Aviora
            </p>
            <WordRotate
              words={[...ACTIVATE_WORDS]}
              duration={ACTIVATE_WORD_MS}
              className="mt-6 max-w-4xl text-balance text-3xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)] min-[400px]:text-4xl sm:text-5xl md:text-6xl"
              motionProps={{
                initial: { opacity: 0, y: 40 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -36 },
                transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              }}
            />
          </motion.div>
        ) : null}

        {step === "intro" ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
              Aviora · Interview mode
            </p>
            <KineticText
              as="h1"
              text={"Practice like it's the real thing."}
              className="mt-4 max-w-4xl justify-center px-1 text-center text-[clamp(1.375rem,5.5vw+0.6rem,3rem)] leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl [&_span]:cursor-default [&_span]:select-none"
            />
            <p className="mt-4 max-w-xl px-2 text-base leading-snug text-white/75 sm:px-0 sm:text-lg">
              Tell us who you are, where you&apos;re interviewing, and upload your
              resume—we&apos;ll configure your session.
            </p>
            <PulsatingButton
              type="button"
              variant="ripple"
              duration="2s"
              distance="12px"
              className="mt-10 h-12 w-full max-w-xs rounded-xl border-2 border-black bg-white px-8 text-base font-black text-black shadow-[6px_6px_0_0_rgba(0,0,0,0.45)] hover:bg-white/95 sm:w-auto sm:max-w-none"
              onClick={() => setStep("form")}
            >
              Fill the form
            </PulsatingButton>
          </motion.div>
        ) : null}

        {step === "form" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="flex w-full min-w-0 justify-center px-0 py-1 sm:py-2"
          >
            <InterviewForm
              onSubmit={handleFormSubmit}
              onCancel={() => setStep("intro")}
            />
          </motion.div>
        ) : null}

        {step === "setup" ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="flex w-full min-w-0 justify-center px-1 py-6 sm:py-8"
          >
            <SetupEnvironment userName={profile?.name} />
          </motion.div>
        ) : null}

        {step === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex w-full min-w-0 flex-col items-center px-1 pb-8 sm:px-0"
          >
            <InterviewCards profile={profile} />
          </motion.div>
        ) : null}
      </AnimatePresence>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}
