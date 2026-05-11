"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Route } from "lucide-react";
import { motion } from "motion/react";

export default function ResumeAnalysisCard({
  className,
  onOpenRoadmap,
  disabled,
}: {
  className?: string;
  onOpenRoadmap?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className={cn(
        "flex flex-col rounded-2xl border-2 border-black bg-gradient-to-br from-cyan-50 via-white to-violet-50 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] sm:p-8",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl border-2 border-black bg-[#a5f3fc] shadow-[3px_3px_0_0_#000]">
        <Route className="size-6 text-black" strokeWidth={2.25} />
      </div>
      <h3 className="mt-5 text-xl font-black tracking-tight text-neutral-900">
        Interview with personalized roadmap
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Uses your resume and company context to build a focused prep plan and
        targeted drills.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="mt-6 h-11 w-full border-2 border-black bg-white font-bold text-black shadow-[4px_4px_0_0_#000] hover:bg-neutral-50 sm:w-auto"
        onClick={onOpenRoadmap}
      >
        Start roadmap track
      </Button>
    </motion.article>
  );
}
