"use client";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { InterviewProfile } from "./types";
import { INTERVIEW_ROUND_OPTIONS } from "./types";
import type { InterviewRoundStage } from "@/lib/interview-session-storage";
import { useState } from "react";

const DURATIONS = [15, 30, 45, 60] as const;

export default function InterviewForm({
  className,
  onSubmit,
  onCancel,
}: {
  className?: string;
  onSubmit: (data: InterviewProfile) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [durationMinutes, setDurationMinutes] =
    useState<(typeof DURATIONS)[number]>(30);
  const [roundStage, setRoundStage] =
    useState<InterviewRoundStage>("technical");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedCompany = company.trim();
    if (!trimmedName || !trimmedCompany) {
      setError("Please enter your name and company.");
      return;
    }
    if (!resumeFile) {
      setError("Please upload your resume.");
      return;
    }
    if (roundStage === "screening") {
      const jd = jobDescription.trim();
      if (!jd) {
        setError("Paste the job description (JD) for screening match.");
        return;
      }
      if (jd.length < 80) {
        setError("JD looks too short — paste the full posting text when possible.");
        return;
      }
    }
    setError(null);
    setPending(true);
    try {
      const fd = new FormData();
      fd.append("file", resumeFile);
      const res = await fetch("/api/interview/resume-text", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(json.error || "Could not read resume file.");
      }
      const resumeText = json.text?.trim() ?? "";
      if (!resumeText.length) {
        throw new Error("Resume text was empty after parsing.");
      }
      await Promise.resolve(
        onSubmit({
          name: trimmedName,
          company: trimmedCompany,
          resumeFile,
          resumeText,
          durationMinutes,
          roundStage,
          ...(roundStage === "screening"
            ? { jobDescription: jobDescription.trim() }
            : {}),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn(
        "w-full min-w-0 max-w-md rounded-2xl border-2 border-white/35 bg-black/25 p-4 shadow-[8px_8px_0_0_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8",
        className,
      )}
    >
      <h2 className="text-xl font-bold tracking-tight text-white">
        Interview setup
      </h2>
      <p className="mt-1 text-sm text-white/75">
        We’ll tailor rounds using your profile and resume.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-name" className="text-white/90">
            Name
          </Label>
          <input
            id="interview-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="min-h-11 rounded-xl border-2 border-white/40 bg-white/95 px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-company" className="text-white/90">
            Company name
          </Label>
          <input
            id="interview-company"
            name="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Target employer or your current company"
            className="min-h-11 rounded-xl border-2 border-white/40 bg-white/95 px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-round" className="text-white/90">
            Interview stage
          </Label>
          <select
            id="interview-round"
            value={roundStage}
            onChange={(e) =>
              setRoundStage(e.target.value as InterviewRoundStage)
            }
            className="min-h-11 rounded-xl border-2 border-white/40 bg-white/95 px-3 py-2.5 text-base font-semibold text-neutral-900 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:text-sm"
          >
            {INTERVIEW_ROUND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-white/60">
            Screening is JD ↔ CV analysis only (no AI voice). Technical includes
            resume deep-dive + coding; managerial and HR use a formal
            interviewer tone.
          </p>
        </div>

        {roundStage === "screening" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="interview-jd" className="text-white/90">
              Job description (JD)
            </Label>
            <textarea
              id="interview-jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              placeholder="Paste the full job posting: responsibilities, requirements, and keywords."
              className="min-h-[160px] rounded-xl border-2 border-white/40 bg-white/95 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="interview-duration" className="text-white/90">
            Session duration
          </Label>
          <select
            id="interview-duration"
            value={durationMinutes}
            onChange={(e) =>
              setDurationMinutes(Number(e.target.value) as (typeof DURATIONS)[number])
            }
            className="min-h-11 rounded-xl border-2 border-white/40 bg-white/95 px-3 py-2.5 text-base font-semibold text-neutral-900 focus-visible:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:text-sm"
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m} minutes (auto end)
              </option>
            ))}
          </select>
          <p className="text-xs text-white/60">
            Matches Vapi max call length — session ends when time is up.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-white/90">Upload your resume</Label>
          <div className="overflow-hidden rounded-xl border-2 border-white/35 bg-white/95">
            <FileUpload
              accept=".pdf,.doc,.docx,application/pdf"
              onChange={(files) => {
                const f = files[0];
                setResumeFile(f ?? null);
              }}
            />
          </div>
          <p className="text-xs text-white/60">
            PDF or Word · single file
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-amber-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full border-2 border-white/50 bg-transparent text-white hover:bg-white/10 sm:w-auto"
            onClick={onCancel}
            disabled={pending}
          >
            Back
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={pending}
          className="min-h-11 w-full border-2 border-black bg-white font-semibold text-black shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:bg-white/95 sm:w-auto"
        >
          {pending ? "Reading resume…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
