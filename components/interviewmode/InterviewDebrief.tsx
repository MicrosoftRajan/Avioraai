"use client";

import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { Highlighter } from "@/components/ui/highlighter";
import type { InterviewDebriefPayload } from "@/lib/interview-session-storage";
import { INTERVIEW_DEBRIEF_KEY } from "@/lib/interview-session-storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function CoachingLine({
  line,
  highlightTerms,
}: {
  line: string;
  highlightTerms: string[];
}) {
  if (!highlightTerms.length) {
    return <span>{line}</span>;
  }
  const sorted = [...highlightTerms].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sorted.map(escapeRegExp).join("|")})`, "gi");
  const parts = line.split(pattern);
  return (
    <span className="leading-relaxed">
      {parts.map((part, i) => {
        const isHit = sorted.some(
          (t) => t.toLowerCase() === part.toLowerCase(),
        );
        return isHit ? (
          <Highlighter key={`${i}-${part}`} color="#fde047" isView action="highlight">
            {part}
          </Highlighter>
        ) : (
          <span key={`${i}-${part}`}>{part}</span>
        );
      })}
    </span>
  );
}

type SummaryResponse = {
  summary: {
    headline: string;
    bullets: string[];
    roadmap: { title: string; focus: string[] }[] | null;
    professionalAudit?: {
      improvements: { line: string; highlightTerms: string[] }[];
      vocabularyObserved: string[];
    };
  };
  aiEnhanced: boolean;
};

export default function InterviewDebrief() {
  const router = useRouter();
  const [payload, setPayload] = useState<InterviewDebriefPayload | null>(null);
  const [remote, setRemote] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(INTERVIEW_DEBRIEF_KEY);
    if (!raw) {
      router.replace("/interview-mode");
      return;
    }
    try {
      const p = JSON.parse(raw) as InterviewDebriefPayload;
      setPayload(p);

      void fetch("/api/interview/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      })
        .then((r) => r.json())
        .then((data: SummaryResponse) => setRemote(data))
        .catch(() => setRemote(null))
        .finally(() => setLoading(false));
    } catch {
      router.replace("/interview-mode");
    }
  }, [router]);

  useEffect(() => {
    if (!payload) return;
    const key = `aviora_interview_confetti_shown_${payload.endedAt}`;
    const already = sessionStorage.getItem(key) === "1";
    if (already) return;

    // Fire a short sequence once per completed session.
    const api = confettiRef.current;
    if (!api) return;
    sessionStorage.setItem(key, "1");

    void api.fire({
      particleCount: 90,
      spread: 70,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.25 },
    });
    const t = window.setTimeout(() => {
      void api.fire({
        particleCount: 70,
        spread: 95,
        startVelocity: 30,
        origin: { x: 0.3, y: 0.2 },
      });
      void api.fire({
        particleCount: 70,
        spread: 95,
        startVelocity: 30,
        origin: { x: 0.7, y: 0.2 },
      });
    }, 250);

    return () => window.clearTimeout(t);
  }, [payload]);

  if (!payload) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
        Loading debrief…
      </div>
    );
  }

  const summary = remote?.summary;
  const bullets =
    summary?.bullets?.length ? summary.bullets : [];

  return (
    <div className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-3xl px-4 pb-16 pt-10">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
      />
      <Link
        href="/interview-mode"
        className="text-sm font-bold text-neutral-700 underline-offset-4 hover:underline"
      >
        ← Back to interview mode
      </Link>

      <header className="mt-6 rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
          Session complete · {payload.company}
        </p>
        <h1 className="mt-2 text-2xl font-black text-neutral-900">
          {loading ? "Preparing your feedback…" : summary?.headline ?? "Your feedback"}
        </h1>
        {remote?.aiEnhanced ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">
            AI-enhanced tips (optional OpenAI key)
          </p>
        ) : null}
      </header>

      {payload.weaknessHints.length ? (
        <section className="mt-6 rounded-2xl border-2 border-dashed border-neutral-400 bg-[#fffef5] p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-neutral-600">
            Signals noticed during your answers
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-800">
            {payload.weaknessHints.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border-2 border-black bg-[#e0f2fe] p-6">
        <h2 className="text-lg font-black text-neutral-900">
          {payload.mode === "mock"
            ? "How to improve for this company"
            : "Improvement focus & milestones"}
        </h2>
        {loading && !bullets.length ? (
          <p className="mt-3 text-sm text-neutral-600">Analyzing transcript…</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm font-semibold leading-relaxed text-neutral-900">
            {(bullets.length ? bullets : ["Keep practicing timed verbal answers tied to your CV metrics."]).map(
              (b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-black text-neutral-500">{i + 1}.</span>
                  <span>{b}</span>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      {summary?.professionalAudit &&
      (summary.professionalAudit.improvements.length > 0 ||
        summary.professionalAudit.vocabularyObserved.length > 0) ? (
        <section className="mt-6 rounded-2xl border-2 border-black bg-[#faf5ff] p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <h2 className="text-lg font-black text-neutral-900">
            Formal communication review
          </h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Highlighted terms show vocabulary to lean on; vocabulary list pulls
            from what you actually said.
          </p>

          {summary.professionalAudit.improvements.length > 0 ? (
            <ul className="mt-4 space-y-4 text-sm font-semibold text-neutral-900">
              {summary.professionalAudit.improvements.map((imp, idx) => (
                <li key={`${idx}-${imp.line.slice(0, 24)}`} className="flex gap-2">
                  <span className="font-black text-neutral-400">{idx + 1}.</span>
                  <CoachingLine
                    line={imp.line}
                    highlightTerms={imp.highlightTerms}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {summary.professionalAudit.vocabularyObserved.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-600">
                Words & phrases you used
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {summary.professionalAudit.vocabularyObserved.map((w) => (
                  <li
                    key={w}
                    className="rounded-full border-2 border-neutral-800 bg-white px-3 py-1 text-xs font-bold text-neutral-900"
                  >
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {payload.mode === "roadmap" && summary?.roadmap?.length ? (
        <section className="mt-6 space-y-4">
          <h2 className="text-lg font-black text-neutral-900">
            Personalized roadmap (where you lag & how to fix it)
          </h2>
          {summary.roadmap.map((week, idx) => (
            <article
              key={week.title}
              className="rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_0_rgba(0,0,0,0.85)]"
            >
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                Week {idx + 1}
              </p>
              <h3 className="mt-1 text-base font-black">{week.title}</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {week.focus.map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {payload.codingQuestion ? (
        <section className="mt-6 rounded-2xl border-2 border-neutral-300 bg-neutral-50 p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-neutral-600">
            Coding prompt you saw
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-800">
            {payload.codingQuestion}
          </p>
        </section>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button
          asChild
          className="border-2 border-black bg-black font-bold text-white"
        >
          <Link href="/interview-mode">Schedule another run</Link>
        </Button>
        <Button asChild variant="outline" className="border-2 border-black font-bold">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
