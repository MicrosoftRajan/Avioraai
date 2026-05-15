"use client";

import { useEffect } from "react";

/** Dev-only: hide known benign SDK warnings forwarded to the Next.js terminal. */
const SUPPRESSED_WARN_FRAGMENTS = [
  "Clerk has been loaded with development keys",
  "[React Flow]: It looks like you've created a new nodeTypes or edgeTypes",
  "Meeting ended due to ejection",
  "Meeting has ended",
] as const;

export default function DevConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const text = args.map((a) => String(a)).join(" ");
      if (SUPPRESSED_WARN_FRAGMENTS.some((frag) => text.includes(frag))) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
