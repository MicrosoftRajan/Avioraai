"use client";

import type { CompanyCodingChallenge } from "@/lib/interview-coding-questions";
import type { InterviewCodingLanguage } from "@/components/interviewmode/coding-languages";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { Code2, Monitor } from "lucide-react";

export default function CodingEnvironmentGate({
  open,
  company,
  challenge,
  language,
  onLanguageChange,
  onApprove,
  onDecline,
}: {
  open: boolean;
  company: string;
  challenge: CompanyCodingChallenge;
  language: InterviewCodingLanguage;
  onLanguageChange: (lang: InterviewCodingLanguage) => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="coding-gate-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
            className="w-full max-w-lg rounded-2xl border-[3px] border-black bg-white p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)]"
          >
            <motion.div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#fde047]">
                <Monitor className="size-6" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                  Coding section
                </p>
                <h2
                  id="coding-gate-title"
                  className="mt-1 text-xl font-black text-neutral-900"
                >
                  Open coding environment?
                </h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
                  Your interviewer is moving to the live coding segment. We will
                  open an in-browser IDE with a{" "}
                  <span className="font-bold text-neutral-900">{company}</span>
                  -style question, test cases on the left, and a code editor on
                  the right.
                </p>
              </div>
            </motion.div>

            <div className="mt-5 rounded-xl border-2 border-black bg-neutral-50 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-600">
                <Code2 className="size-3.5" aria-hidden />
                {challenge.title} · {challenge.difficulty}
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-800">
                {challenge.frequency}
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-700">
                {challenge.prompt}
              </p>
              <p className="mt-3 text-xs font-bold text-neutral-500">
                {challenge.testCases.length} sample test case
                {challenge.testCases.length === 1 ? "" : "s"} · Language:{" "}
                <label htmlFor="gate-lang" className="sr-only">
                  Programming language
                </label>
                <select
                  id="gate-lang"
                  value={language}
                  onChange={(e) =>
                    onLanguageChange(e.target.value as InterviewCodingLanguage)
                  }
                  className="ml-1 rounded border border-neutral-300 bg-white px-2 py-0.5 font-bold text-neutral-900"
                >
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="C">C</option>
                  <option value="Go">Go</option>
                </select>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                className="h-11 flex-1 border-2 border-black bg-black font-bold text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
                onClick={onApprove}
              >
                Yes, open environment
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-2 border-black bg-white font-bold"
                onClick={onDecline}
              >
                Not now
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
