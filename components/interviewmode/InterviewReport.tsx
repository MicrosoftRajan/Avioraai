"use client";

import { cn } from "@/lib/utils";

/**
 * Placeholder for post-session rubric scores and narrative feedback.
 */
export default function InterviewReport({
  className,
}: {
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border-2 border-dashed border-white/40 bg-black/20 p-8 text-center text-white/80 backdrop-blur-md",
        className,
      )}
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-white/50">
        Interview report
      </p>
      <p className="mt-2 text-lg font-bold text-white">
        Complete a session to see scores and feedback here.
      </p>
    </section>
  );
}
