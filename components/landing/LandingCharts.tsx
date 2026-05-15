"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ChartAreaAxes = dynamic(
  () =>
    import("@/components/landing/PerformanceCharts").then((m) => m.ChartAreaAxes),
  { ssr: false },
);

const ChartPieDonutText = dynamic(
  () =>
    import("@/components/landing/PerformanceCharts").then((m) => m.ChartPieDonutText),
  { ssr: false },
);

const chartPlaceholderClass =
  "min-h-[260px] w-full rounded-xl border-[3px] border-black bg-neutral-100 shadow-[6px_6px_0_0_#000]";

/** Mount charts only when scrolled near viewport — avoids Recharts sizing warnings. */
export default function LandingCharts() {
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
      { rootMargin: "120px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
      {visible ? (
        <>
          <div className="min-w-0" data-gsap-reveal data-neo-lift>
            <ChartAreaAxes />
          </div>
          <div className="min-w-0" data-gsap-reveal data-neo-lift>
            <ChartPieDonutText />
          </div>
        </>
      ) : (
        <>
          <div className={chartPlaceholderClass} aria-hidden />
          <div className={chartPlaceholderClass} aria-hidden />
        </>
      )}
    </div>
  );
}
