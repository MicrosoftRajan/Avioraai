"use client";

import AIAvatar from "./AIAvatar";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export default function SetupEnvironment({
  className,
  userName,
}: {
  className?: string;
  userName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex w-full min-w-0 max-w-lg flex-col items-center gap-5 rounded-2xl border-2 border-white/35 bg-black/30 px-5 py-8 text-center backdrop-blur-xl sm:gap-6 sm:px-8 sm:py-10",
        className,
      )}
    >
      <AIAvatar size="lg" />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">
          Please wait
        </p>
        <p className="mt-3 text-xl font-bold leading-snug text-white sm:text-2xl">
          Setting up the interview environment
          {userName ? (
            <>
              {" "}
              <span className="text-white/80">for {userName}</span>
            </>
          ) : null}
          …
        </p>
        <p className="mt-3 text-sm text-white/70">
          Parsing your resume and aligning question difficulty with your target
          role.
        </p>
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-white"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
