"use client";

import CodingEnvironmentGate from "@/components/interviewmode/CodingEnvironmentGate";
import InterviewCodingWorkspace from "@/components/interviewmode/InterviewCodingWorkspace";
import { INTERVIEW_ROUND_OPTIONS } from "@/components/interviewmode/types";
import {
  coerceInterviewCodingLanguage,
  defaultInterviewCodingLanguage,
  type InterviewCodingLanguage,
} from "@/components/interviewmode/coding-languages";
import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { Ripple } from "@/components/ui/ripple";
import { configureInterviewAssistant } from "@/lib/configure-interview-assistant";
import { pickInterviewer } from "@/lib/interview-interviewer";
import {
  buildCodingSolutionStarter,
  challengeDisplayTitle,
  resolveCodingChallenge,
  type CompanyCodingChallenge,
} from "@/lib/interview-coding-questions";
import { collectWeaknessHintsFromUserLine } from "@/lib/interview-debrief";
import { persistInterviewSessionDebrief } from "@/lib/actions/interview-mode.actions";
import {
  type InterviewDebriefPayload,
  INTERVIEW_DEBRIEF_KEY,
  INTERVIEW_SESSION_KEY,
  type InterviewSessionPayload,
  type InterviewTranscriptLine,
} from "@/lib/interview-session-storage";
import { isBenignMeetingShutdown } from "@/lib/vapi-meeting-errors";
import { safeVapiStart, safeVapiStop, vapi } from "@/lib/vapi.sdk";
import { cn } from "@/lib/utils";
import { ArrowLeft, Mic, MicOff, PhoneOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CallStatus = "idle" | "connecting" | "active" | "ended";

function formatMmSs(total: number) {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type ToolCallMsg = {
  type?: string;
  toolCallList?: {
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }[];
};

export default function InterviewSession() {
  const router = useRouter();
  const [payload, setPayload] = useState<InterviewSessionPayload | null>(null);
  const payloadRef = useRef<InterviewSessionPayload | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [messages, setMessages] = useState<InterviewTranscriptLine[]>([]);
  const messagesRef = useRef<InterviewTranscriptLine[]>([]);
  const weaknessHintsRef = useRef<string[]>([]);
  const codingQuestionRef = useRef("");
  const codingChallengeRef = useRef<CompanyCodingChallenge | null>(null);
  const [codingOpen, setCodingOpen] = useState(false);
  const [codingGateOpen, setCodingGateOpen] = useState(false);
  const [pendingChallenge, setPendingChallenge] =
    useState<CompanyCodingChallenge | null>(null);
  const [codingQuestion, setCodingQuestion] = useState("");
  const [codingSource, setCodingSource] = useState("");
  const [codingLang, setCodingLang] = useState<InterviewCodingLanguage>(
    defaultInterviewCodingLanguage,
  );
  const [remainingSec, setRemainingSec] = useState(0);
  const navigatedRef = useRef(false);
  const callEndingRef = useRef(false);
  const confettiRef = useRef<ConfettiRef>(null);
  const [techFaqs, setTechFaqs] = useState<string[]>([]);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    codingQuestionRef.current = codingQuestion;
  }, [codingQuestion]);

  const totalSec = useMemo(
    () => Math.max(180, (payload?.durationMinutes ?? 30) * 60),
    [payload?.durationMinutes],
  );

  const interviewer = useMemo(() => {
    const roundStage = payload?.roundStage ?? "technical";
    const company = payload?.company ?? "";
    if (payload?.interviewerName && payload?.interviewerTitle) {
      return {
        name: payload.interviewerName,
        firstName:
          payload.interviewerName.trim().split(/\s+/)[0] ?? "Alex",
        title: payload.interviewerTitle,
      };
    }
    return pickInterviewer(roundStage, company || "Company");
  }, [
    payload?.company,
    payload?.interviewerName,
    payload?.interviewerTitle,
    payload?.roundStage,
  ]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const raw = sessionStorage.getItem(INTERVIEW_SESSION_KEY);
    if (!raw) {
      router.replace("/interview-mode");
      return;
    }
    try {
      const p = JSON.parse(raw) as InterviewSessionPayload;
      if (!p.mode || !p.resumeText) {
        router.replace("/interview-mode");
        return;
      }
      if (p.roundStage === "screening") {
        router.replace("/interview-mode/screening");
        return;
      }
      navigatedRef.current = false;
      weaknessHintsRef.current = [];
      messagesRef.current = [];
      codingQuestionRef.current = "";
      setMessages([]);
      setSubtitle("");
      setCodingOpen(false);
      setCodingQuestion("");
      setCodingLang(defaultInterviewCodingLanguage());
      setCallStatus("idle");
      setMuted(false);
      setPayload(p);
      setRemainingSec(Math.max(180, p.durationMinutes * 60));
    } catch {
      router.replace("/interview-mode");
    }
  }, [router]);

  useEffect(() => {
    const rs = payload?.roundStage ?? "technical";
    if (rs !== "technical" || !payload?.resumeText) return;
    let cancelled = false;
    void fetch("/api/interview/technical-faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: payload.resumeText,
        company: payload.company,
      }),
    })
      .then((r) => r.json())
      .then((data: { questions?: string[] }) => {
        if (!cancelled && Array.isArray(data.questions))
          setTechFaqs(data.questions);
      })
      .catch(() => {
        if (!cancelled) setTechFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [payload?.resumeText, payload?.company, payload?.roundStage]);

  const finalizeToDebrief = useCallback(async () => {
    if (navigatedRef.current) return;
    const p = payloadRef.current;
    if (!p?.mode) return;
    navigatedRef.current = true;
    const endedAt = Date.now();
    const debrief: InterviewDebriefPayload = {
      mode: p.mode,
      name: p.name,
      company: p.company,
      durationMinutes: p.durationMinutes,
      messages: messagesRef.current,
      weaknessHints: weaknessHintsRef.current,
      codingQuestion:
        codingChallengeRef.current
          ? `${challengeDisplayTitle(codingChallengeRef.current)} — ${codingChallengeRef.current.prompt.slice(0, 200)}`
          : codingQuestionRef.current.trim() || null,
      endedAt,
      roundStage: p.roundStage ?? "technical",
    };
    sessionStorage.setItem(INTERVIEW_DEBRIEF_KEY, JSON.stringify(debrief));
    const sid = p.supabaseSessionId;
    if (sid) {
      try {
        const r = await persistInterviewSessionDebrief(sid, debrief);
        if (!r.ok) {
          console.warn("[interview-mode] Failed to persist debrief to Supabase");
        }
      } catch (err) {
        console.error("[interview-mode] Supabase debrief error:", err);
      }
    }

    const dedupeKey = `aviora_interview_confetti_shown_${endedAt}`;
    const api = confettiRef.current;
    if (api && sessionStorage.getItem(dedupeKey) !== "1") {
      sessionStorage.setItem(dedupeKey, "1");
      try {
        await api.fire({
          particleCount: 90,
          spread: 70,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.25 },
        });
        await new Promise((r) => window.setTimeout(r, 250));
        await Promise.all([
          api.fire({
            particleCount: 70,
            spread: 95,
            startVelocity: 30,
            origin: { x: 0.3, y: 0.2 },
          }),
          api.fire({
            particleCount: 70,
            spread: 95,
            startVelocity: 30,
            origin: { x: 0.7, y: 0.2 },
          }),
        ]);
        await new Promise((r) => window.setTimeout(r, 350));
      } catch {
        sessionStorage.removeItem(dedupeKey);
      }
    }

    router.push("/interview-mode/debrief");
  }, [router]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus("active");
      const d = payloadRef.current?.durationMinutes ?? 30;
      setRemainingSec(Math.max(180, d * 60));
    };

    const onCallEnd = () => {
      if (callEndingRef.current) return;
      callEndingRef.current = true;
      setCallStatus("ended");
      void finalizeToDebrief();
    };

    const onMessage = (message: unknown) => {
      const m = message as ToolCallMsg & {
        type?: string;
        role?: string;
        transcriptType?: string;
        transcript?: string;
      };

      if (m.type === "tool-calls" && Array.isArray(m.toolCallList)) {
        for (const tc of m.toolCallList) {
          if (tc.function?.name === "open_coding_workspace") {
            try {
              const args = JSON.parse(tc.function.arguments || "{}") as {
                question?: string;
                language_hint?: string;
                question_id?: string;
              };
              const company = payloadRef.current?.company ?? "Tech";
              const challenge = resolveCodingChallenge(company, {
                aiQuestion: args.question?.trim(),
                questionId: args.question_id?.trim(),
                sessionSeed: payloadRef.current?.name ?? "session",
              });
              const lang = args.language_hint?.trim()
                ? coerceInterviewCodingLanguage(args.language_hint.trim())
                : codingLang;

              codingChallengeRef.current = challenge;
              setPendingChallenge(challenge);
              setCodingQuestion(challengeDisplayTitle(challenge));
              setCodingLang(lang);
              setCodingGateOpen(true);
            } catch {
              /* ignore */
            }
          }
        }
      }

      if (
        m.type === "transcript" &&
        m.transcriptType === "final" &&
        m.transcript &&
        (m.role === "assistant" || m.role === "user")
      ) {
        const line: InterviewTranscriptLine = {
          role: m.role,
          content: m.transcript,
        };
        messagesRef.current = [...messagesRef.current, line];
        setMessages(messagesRef.current);
        setSubtitle(m.transcript);

        if (m.role === "user") {
          const hints = collectWeaknessHintsFromUserLine(m.transcript);
          if (hints.length) {
            weaknessHintsRef.current = [
              ...new Set([...weaknessHintsRef.current, ...hints]),
            ].slice(0, 24);
          }
        }
      }
    };

    const onError = (e: unknown) => {
      if (isBenignMeetingShutdown(e)) return;
      console.warn("[vapi]", e);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
    };
  }, [finalizeToDebrief]);

  useEffect(() => {
    if (callStatus !== "active") return;
    const id = window.setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          safeVapiStop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [callStatus]);

  useEffect(() => {
    return () => {
      safeVapiStop();
    };
  }, []);

  const startCall = () => {
    const p = payloadRef.current;
    if (!p?.mode) return;
    callEndingRef.current = false;
    setCallStatus("connecting");
    const first = p.name.trim().split(/\s+/)[0] || "there";
    const roundStage = p.roundStage ?? "technical";
    const sessionInterviewer =
      p.interviewerName && p.interviewerTitle
        ? {
            name: p.interviewerName,
            firstName: p.interviewerName.trim().split(/\s+/)[0] ?? "Alex",
            title: p.interviewerTitle,
          }
        : pickInterviewer(roundStage, p.company);

    const assistant = configureInterviewAssistant({
      candidateName: p.name.trim(),
      companyName: p.company.trim(),
      resumeText: p.resumeText,
      durationMinutes: p.durationMinutes,
      mode: p.mode,
      roundStage,
      interviewer: sessionInterviewer,
    });

    const assistantOverrides = {
      variableValues: {
        candidate_name: first,
        company_name: p.company.trim(),
        interviewer_first_name: sessionInterviewer.firstName,
        interviewer_name: sessionInterviewer.name,
        interviewer_title: sessionInterviewer.title,
      },
      clientMessages: ["transcript", "tool-calls"],
      serverMessages: [],
    };

    // @ts-expect-error Vapi start overload
    safeVapiStart(assistant, assistantOverrides);
  };

  const stopCall = () => {
    if (callEndingRef.current) return;
    callEndingRef.current = true;
    setCallStatus("ended");
    safeVapiStop();
    void finalizeToDebrief();
  };

  const toggleMute = () => {
    try {
      const next = !vapi.isMuted();
      vapi.setMuted(next);
      setMuted(next);
    } catch {
      /* noop */
    }
  };

  const sessionBackdrop =
    "relative isolate min-h-[calc(100dvh-5.25rem)] w-full overflow-hidden rounded-[28px] border border-violet-200/40 bg-[linear-gradient(165deg,#eef2ff_0%,#fafafa_42%,#ecfeff_100%)] shadow-[inset_0_0_100px_rgba(139,92,246,0.08)]";

  if (!payload?.mode) {
    return (
      <div className={sessionBackdrop}>
        <Ripple
          variant="on-dark"
          numCircles={10}
          mainCircleSize={190}
          mainCircleOpacity={0.24}
          className="mask-[linear-gradient(to_bottom,white_0%,white_45%,transparent_100%)] opacity-[0.75]"
        />
        <div className="relative z-10 flex min-h-[40vh] items-center justify-center px-4 text-sm font-medium text-neutral-600">
          Loading session…
        </div>
      </div>
    );
  }

  const roundStage = payload.roundStage ?? "technical";
  const stageLabel =
    INTERVIEW_ROUND_OPTIONS.find((o) => o.value === roundStage)?.label ??
    "Interview";

  return (
    <div className={sessionBackdrop}>
      <Ripple
        variant="on-dark"
        numCircles={10}
        mainCircleSize={190}
        mainCircleOpacity={0.24}
        className="mask-[linear-gradient(to_bottom,white_0%,white_50%,transparent_100%)] opacity-[0.72]"
      />
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
      />
      <div className="relative z-10 mx-auto min-h-[calc(100dvh-5.25rem)] w-full max-w-5xl px-4 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/interview-mode"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-700 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Interview setup
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              "rounded-full border-2 border-black px-4 py-2 font-mono text-sm font-black tabular-nums shadow-[3px_3px_0_0_#000]",
              remainingSec < 120 && callStatus === "active"
                ? "bg-red-100"
                : "bg-[#fef9c3]",
            )}
          >
            {callStatus === "active" ? (
              <>
                Time left{" "}
                <span className="text-black">{formatMmSs(remainingSec)}</span>
                <span className="mx-2 text-neutral-400">/</span>
                <span className="text-neutral-600">{formatMmSs(totalSec)}</span>
              </>
            ) : (
              <span className="text-neutral-600">
                Scheduled length {payload.durationMinutes} min
              </span>
            )}
          </div>
          <span className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-neutral-600">
            {payload.mode === "mock" ? "Mock interview" : "Roadmap track"}
          </span>
          <span className="rounded-full border-2 border-black bg-[#e0e7ff] px-3 py-1 text-xs font-black uppercase tracking-widest text-neutral-900">
            {stageLabel}
          </span>
        </div>
      </div>

      <header className="mb-8 rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
          Voice session · {payload.company} · {stageLabel}
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-neutral-900">
          Hey {payload.name.split(/\s+/)[0]} — interview with {interviewer.name}
        </h1>
        <p className="mt-1 text-sm font-semibold text-neutral-700">
          {interviewer.title} · {payload.company}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          {roundStage === "technical" ? (
            <>
              Start when you&apos;re ready. This technical round blends CV-deep
              review with realistic depth questions. When it&apos;s time to code,
              you&apos;ll be asked permission before we open the IDE with a{" "}
              {payload.company}-style question and test cases in comments. The call
              ends automatically when the timer hits zero.
            </>
          ) : roundStage === "managerial" ? (
            <>
              Executive-style leadership conversation — formal tone and
              polished wording throughout. No live coding in this round; focus on
              judgment, stakeholders, and delivery accountability.
            </>
          ) : (
            <>
              Structured HR conversation modeled after professional screenings —
              courteous, formal tone covering motivations, expectations, and values
              fit as appropriate. No coding exercises.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {callStatus === "idle" ? (
            <Button
              type="button"
              className="h-11 border-2 border-black bg-black px-6 font-bold text-white shadow-[4px_4px_0_0_rgba(255,255,255,0.15)]"
              onClick={startCall}
            >
              Start interview session
            </Button>
          ) : null}
          {callStatus === "connecting" ? (
            <Button
              type="button"
              disabled
              className="h-11 border-2 border-black bg-neutral-200 font-bold"
            >
              Connecting…
            </Button>
          ) : null}
          {callStatus === "active" ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-2 border-black bg-white font-bold"
                onClick={toggleMute}
              >
                {muted ? (
                  <MicOff className="size-4" />
                ) : (
                  <Mic className="size-4" />
                )}
                {muted ? "Unmute" : "Mute"}
              </Button>
              <Button
                type="button"
                className="h-11 border-2 border-black bg-red-600 px-6 font-bold text-white"
                onClick={stopCall}
              >
                <PhoneOff className="size-4" />
                End session
              </Button>
            </>
          ) : null}
        </div>
      </header>

      {roundStage === "technical" && techFaqs.length > 0 ? (
        <details
          open
          className="mb-8 rounded-2xl border-2 border-black bg-[#fffef5] p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        >
          <summary className="cursor-pointer text-sm font-black uppercase tracking-widest text-neutral-700">
            Frequently asked questions (tailored to your CV)
          </summary>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold leading-relaxed text-neutral-900">
            {techFaqs.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </details>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border-2 border-black bg-[#fffef5] p-4 lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
            Live subtitle
          </p>
          <p className="mt-3 min-h-[96px] text-sm font-semibold leading-relaxed text-neutral-900">
            {subtitle || "Waiting for audio…"}
          </p>
        </section>

        <section className="rounded-2xl border-2 border-black bg-white p-4 lg:col-span-3">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
            Transcript
          </p>
          <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto text-sm">
            {messages.length === 0 ? (
              <p className="text-neutral-500">Transcripts appear here.</p>
            ) : (
              messages.map((m, i) => (
                <p key={`${i}-${m.role}-${m.content.slice(0, 12)}`}>
                  <span className="font-black text-neutral-800">
                    {m.role === "assistant"
                      ? interviewer.firstName
                      : payload.name.split(/\s+/)[0]}
                    :
                  </span>{" "}
                  <span className="text-neutral-700">{m.content}</span>
                </p>
              ))
            )}
          </div>
        </section>
      </div>

      <CodingEnvironmentGate
        open={codingGateOpen && pendingChallenge != null}
        company={payload.company}
        challenge={
          pendingChallenge ??
          resolveCodingChallenge(payload.company, { sessionSeed: payload.name })
        }
        language={codingLang}
        onLanguageChange={setCodingLang}
        onApprove={() => {
          const challenge =
            pendingChallenge ??
            resolveCodingChallenge(payload.company, {
              sessionSeed: payload.name,
            });
          codingChallengeRef.current = challenge;
          const template = buildCodingSolutionStarter(
            codingLang,
            payload.company,
            challenge,
          );
          codingQuestionRef.current = challenge.prompt;
          setCodingQuestion(challengeDisplayTitle(challenge));
          setCodingSource(template);
          setCodingGateOpen(false);
          setCodingOpen(true);
        }}
        onDecline={() => {
          setCodingGateOpen(false);
          setPendingChallenge(null);
        }}
      />

      <div className="mt-8">
        <InterviewCodingWorkspace
          open={codingOpen}
          company={payload.company}
          challenge={
            codingChallengeRef.current ??
            pendingChallenge ??
            resolveCodingChallenge(payload.company, { sessionSeed: payload.name })
          }
          language={codingLang}
          code={codingSource}
          onCodeChange={setCodingSource}
          onLanguageChange={setCodingLang}
        />
      </div>
    </div>
    </div>
  );
}
