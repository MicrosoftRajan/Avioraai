"use client";

import {
  INTERVIEW_CODING_LANGUAGES,
  type InterviewCodingLanguage,
} from "@/components/interviewmode/coding-languages";
import {
  buildCodingSolutionStarter,
  challengeDisplayTitle,
  extractCodingSolution,
  type CompanyCodingChallenge,
} from "@/lib/interview-coding-questions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

export default function InterviewCodingWorkspace({
  open,
  company,
  challenge,
  language,
  code,
  onCodeChange,
  onLanguageChange,
  className,
}: {
  open: boolean;
  company: string;
  challenge: CompanyCodingChallenge;
  language: InterviewCodingLanguage;
  code: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: InterviewCodingLanguage) => void;
  className?: string;
}) {
  const prevLangRef = useRef(language);
  const openRef = useRef(false);

  useEffect(() => {
    if (!open) {
      openRef.current = false;
      return;
    }
    if (!openRef.current) {
      openRef.current = true;
      if (!code.trim()) {
        onCodeChange(buildCodingSolutionStarter(language, company, challenge));
      }
    }
  }, [open, code, language, company, challenge, onCodeChange]);

  useEffect(() => {
    if (!open) return;
    if (prevLangRef.current === language) return;
    const preserved = extractCodingSolution(code);
    prevLangRef.current = language;
    onCodeChange(
      buildCodingSolutionStarter(language, company, challenge, preserved),
    );
  }, [language, company, challenge, open, code, onCodeChange]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35 }}
          className={cn(
            "rounded-2xl border-2 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,0.85)]",
            className,
          )}
        >
          <motion.div className="flex flex-col gap-3 border-b-2 border-black bg-[#fde047] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <motion.div>
              <p className="text-xs font-black uppercase tracking-widest text-black">
                Coding environment · {company}
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-black">
                {challengeDisplayTitle(challenge)}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-black/75">
                Read the question on the left — write your solution in the
                editor on the right.
              </p>
            </motion.div>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="interview-coding-language"
                className="text-xs font-black uppercase tracking-widest text-black"
              >
                Language
              </label>
              <Select
                value={language}
                onValueChange={(v) =>
                  onLanguageChange(v as InterviewCodingLanguage)
                }
              >
                <SelectTrigger
                  id="interview-coding-language"
                  size="sm"
                  className="h-10 min-w-[10rem] border-2 border-black bg-white font-bold text-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] focus-visible:ring-2 focus-visible:ring-black/40 data-[size=sm]:h-10"
                >
                  <SelectValue placeholder="Choose language" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black font-semibold shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  {INTERVIEW_CODING_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang} className="font-bold">
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <motion.div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <aside className="border-b-2 border-black bg-neutral-50 p-4 lg:border-b-0 lg:border-r-2">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                Question
              </p>
              <p className="mt-1 text-[11px] font-bold text-neutral-600">
                {challenge.frequency}
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-900">
                {challenge.prompt}
              </p>

              <p className="mt-5 text-xs font-black uppercase tracking-widest text-neutral-500">
                Test cases
              </p>
              <ul className="mt-2 space-y-3">
                {challenge.testCases.map((tc) => (
                  <li
                    key={tc.label}
                    className="rounded-lg border-2 border-black bg-white p-3 text-sm shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                  >
                    <p className="text-xs font-black uppercase text-neutral-600">
                      {tc.label}
                    </p>
                    <p className="mt-1 font-mono text-xs leading-relaxed text-neutral-800">
                      <span className="font-bold">Input:</span> {tc.input}
                    </p>
                    <p className="mt-1 font-mono text-xs leading-relaxed text-neutral-800">
                      <span className="font-bold">Expected:</span> {tc.output}
                    </p>
                  </li>
                ))}
              </ul>

              {challenge.constraints.length > 0 ? (
                <>
                  <p className="mt-5 text-xs font-black uppercase tracking-widest text-neutral-500">
                    Constraints
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
                    {challenge.constraints.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </aside>

            <motion.div className="p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-neutral-500">
                Your solution · {language}
              </p>
              <textarea
                spellCheck={false}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                aria-label="Code editor"
                className="min-h-[420px] w-full resize-y rounded-xl border-2 border-black bg-[#0d1117] p-4 font-mono text-sm leading-relaxed text-[#e6edf3] outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-black/30"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
