"use client";

import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import type { InterviewSessionPayload } from "@/lib/interview-session-storage";
import Link from "next/link";
import { useEffect, useState } from "react";

export type JdMatchResult = {
  fitScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  atsKeywords: string[];
};

export default function ScreeningJDPanel({
  session,
}: {
  session: InterviewSessionPayload;
}) {
  const [result, setResult] = useState<JdMatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const jd = session.jobDescription?.trim();
    if (!jd?.length) {
      setError("Missing job description.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    void fetch("/api/interview/jd-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: session.resumeText,
        jobDescription: jd,
        company: session.company,
      }),
    })
      .then(async (r) => {
        const data = (await r.json()) as JdMatchResult & { error?: string };
        if (!r.ok) throw new Error(data.error || "Analysis failed");
        return data;
      })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Something went wrong.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session.resumeText, session.jobDescription, session.company]);

  const score = result?.fitScore ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
      <Link
        href="/interview-mode"
        className="text-sm font-bold text-neutral-700 underline-offset-4 hover:underline"
      >
        ← Back to interview mode
      </Link>

      <header className="mt-6 rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
          Screening round · JD ↔ CV match · {session.company}
        </p>
        <h1 className="mt-2 text-2xl font-black text-neutral-900">
          How well you align with this role
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          No voice session for screening — this is an ATS-oriented read of your
          resume against the job description you pasted.
        </p>
      </header>

      {loading ? (
        <p className="mt-10 text-center text-sm font-semibold text-neutral-600">
          Comparing your CV to the JD…
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm font-medium text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-black bg-[#fef9c3] p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase tracking-widest text-neutral-700">
              Role fit score
            </p>
            <AnimatedCircularProgressBar
              value={Math.min(100, Math.max(0, score))}
              gaugePrimaryColor="#22c55e"
              gaugeSecondaryColor="#e5e5e5"
              className="size-44 text-neutral-900 [&>span]:text-3xl [&>span]:font-black"
            />
            <p className="max-w-[12rem] text-center text-[11px] font-semibold leading-snug text-neutral-700">
              Heuristic match — tune with JD keywords below.
            </p>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border-2 border-black bg-emerald-50/90 p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-900">
                Strengths
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-neutral-900">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border-2 border-black bg-amber-50/90 p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-900">
                Gaps / weaknesses
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-neutral-900">
                {result.weaknesses.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border-2 border-black bg-sky-50/90 p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-sky-900">
                Exact improvements
              </h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-neutral-900">
                {result.improvements.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border-2 border-dashed border-neutral-500 bg-[#fffef5] p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-neutral-700">
                ATS-friendly keywords to weave in
              </h2>
              <p className="mt-2 text-xs font-medium text-neutral-600">
                Mirror phrasing from the JD where truthful — avoid stuffing.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {result.atsKeywords.map((k) => (
                  <li
                    key={k}
                    className="rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-bold text-neutral-900"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
