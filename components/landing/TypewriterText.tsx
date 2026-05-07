"use client";

import { useEffect, useMemo, useState } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? true;
}

export default function TypewriterText({
  text,
  className,
  speedMs = 22,
  startDelayMs = 0,
  cursor = true,
}: {
  text: string;
  className?: string;
  speedMs?: number;
  startDelayMs?: number;
  cursor?: boolean;
}) {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [i, setI] = useState(reduced ? text.length : 0);
  const [started, setStarted] = useState(reduced || startDelayMs === 0);

  useEffect(() => {
    if (reduced) return;
    if (startDelayMs <= 0) return;
    const t = window.setTimeout(() => setStarted(true), startDelayMs);
    return () => window.clearTimeout(t);
  }, [reduced, startDelayMs]);

  useEffect(() => {
    if (reduced) return;
    if (!started) return;
    if (i >= text.length) return;
    const t = window.setTimeout(() => setI((v) => Math.min(text.length, v + 1)), speedMs);
    return () => window.clearTimeout(t);
  }, [reduced, started, i, text.length, speedMs]);

  const shown = text.slice(0, i);
  const done = i >= text.length;

  return (
    <span className={className}>
      {shown}
      {cursor && !reduced ? (
        <span
          aria-hidden
          className={[
            "ml-1 inline-block w-[0.6ch] translate-y-[1px] bg-black",
            done ? "opacity-0" : "opacity-100",
            "animate-pulse",
          ].join(" ")}
        >
          &nbsp;
        </span>
      ) : null}
    </span>
  );
}

