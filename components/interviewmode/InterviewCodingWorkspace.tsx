"use client";

import {
  INTERVIEW_CODING_LANGUAGES,
  type InterviewCodingLanguage,
} from "@/components/interviewmode/coding-languages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

const CODE_PLACEHOLDERS: Record<InterviewCodingLanguage, string> = {
  C: "/* Write your C solution here — the interviewer continues over voice. */",
  "C++": "// Write your C++ solution here — the interviewer continues over voice.",
  Java: "// Write your Java solution here — the interviewer continues over voice.",
  Python: "# Write your Python solution here — the interviewer continues over voice.",
  Go: "// Write your Go solution here — the interviewer continues over voice.",
};

export default function InterviewCodingWorkspace({
  open,
  question,
  language,
  onLanguageChange,
  className,
}: {
  open: boolean;
  question: string;
  language: InterviewCodingLanguage;
  onLanguageChange: (lang: InterviewCodingLanguage) => void;
  className?: string;
}) {
  const placeholder = useMemo(() => CODE_PLACEHOLDERS[language], [language]);

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
          <div className="flex flex-col gap-3 border-b-2 border-black bg-[#fde047] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-black">
                  Coding environment
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-black/80">
                  IDE workspace · read the question, pick your language, then
                  code.
                </p>
              </div>
            </div>
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
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                Question
              </p>
              <div className="min-h-[200px] rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-neutral-900">
                {question}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-neutral-500">
                Your solution · {language}
              </p>
              <textarea
                spellCheck={false}
                placeholder={placeholder}
                className="min-h-[280px] w-full resize-y rounded-xl border-2 border-black bg-[#0d1117] p-4 font-mono text-sm leading-relaxed text-[#e6edf3] outline-none placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-black/30"
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
