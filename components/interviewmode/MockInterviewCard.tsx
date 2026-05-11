"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquareText } from "lucide-react";
import { motion } from "motion/react";

export default function MockInterviewCard({
  className,
  onStart,
  disabled,
}: {
  className?: string;
  onStart?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className={cn(
        "flex flex-col rounded-2xl border-2 border-black bg-white/95 p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] sm:p-8",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-xl border-2 border-black bg-[#fde047] shadow-[3px_3px_0_0_#000]">
        <MessageSquareText className="size-6 text-black" strokeWidth={2.25} />
      </div>
      <h3 className="mt-5 text-xl font-black tracking-tight text-neutral-900">
        Interview
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        Timed mock rounds with realistic follow-ups—HR, technical, and system
        design tracks coming next.
      </p>
      <Button
        type="button"
        disabled={disabled}
        className="mt-6 h-11 w-full border-2 border-black bg-black font-bold text-white shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:bg-neutral-900 sm:w-auto"
        onClick={onStart}
      >
        Start mock interview
      </Button>
    </motion.article>
  );
}
