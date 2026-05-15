"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const AppMindMap = dynamic(() => import("@/components/landing/AppMindMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[520px] w-full animate-pulse rounded-xl border-[3px] border-black bg-neutral-100"
      aria-hidden
    />
  ),
});

const placeholderClass =
  "h-[520px] w-full rounded-xl border-[3px] border-black bg-neutral-100";

/** Loads React Flow only when the mindmap scrolls into view — avoids RF warnings on other routes. */
export default function MindMapSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} data-gsap-reveal data-neo-lift>
      {visible ? <AppMindMap /> : <div className={placeholderClass} aria-hidden />}
    </div>
  );
}
