"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotionSnapshot() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function getReducedMotionServerSnapshot() {
  return false;
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
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const [i, setI] = useState(0);
  const [started, setStarted] = useState(startDelayMs === 0);

  useEffect(() => {
    if (reducedMotion) return;
    if (startDelayMs <= 0) return;
    const t = window.setTimeout(() => setStarted(true), startDelayMs);
    return () => window.clearTimeout(t);
  }, [reducedMotion, startDelayMs]);

  useEffect(() => {
    if (reducedMotion) return;
    if (!started) return;
    if (i >= text.length) return;
    const t = window.setTimeout(() => setI((v) => Math.min(text.length, v + 1)), speedMs);
    return () => window.clearTimeout(t);
  }, [reducedMotion, started, i, text.length, speedMs]);

  const shown = reducedMotion ? text : text.slice(0, i);
  const done = reducedMotion || i >= text.length;

  return (
    <span className={className}>
      {shown}
      {cursor && !reducedMotion ? (
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
