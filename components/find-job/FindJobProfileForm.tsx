"use client";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Label } from "@/components/ui/label";
import type { FindJobProfile } from "@/lib/find-job/types";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

const fieldClass =
  "min-h-11 w-full rounded-xl border-2 border-black bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 sm:text-sm";

export default function FindJobProfileForm({
  initial,
  onSubmit,
  pending,
}: {
  initial?: FindJobProfile | null;
  onSubmit: (profile: FindJobProfile) => void | Promise<void>;
  pending?: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [linkedin, setLinkedin] = useState(initial?.linkedin ?? "");
  const [github, setGithub] = useState(initial?.github ?? "");
  const [targetTitles, setTargetTitles] = useState(initial?.targetTitles ?? "");
  const [skills, setSkills] = useState(initial?.skills ?? "");
  const [workAuth, setWorkAuth] = useState(
    initial?.workAuth ?? "Authorized to work",
  );
  const [experienceYears, setExperienceYears] = useState(
    initial?.experienceYears ?? "3",
  );
  const [remoteOnly, setRemoteOnly] = useState(initial?.remoteOnly ?? true);
  const [careerPageUrls, setCareerPageUrls] = useState(
    initial?.careerPageUrls ?? "",
  );
  const [autoAlign, setAutoAlign] = useState(initial?.autoAlign ?? true);
  const [minFitScore, setMinFitScore] = useState(initial?.minFitScore ?? 55);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText] = useState(initial?.resumeText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const busy = pending || reading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setError("Name and email are required so the agent can apply.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email.");
      return;
    }
    if (!targetTitles.trim()) {
      setError("Add at least one target job title.");
      return;
    }

    let parsedResume = resumeText.trim();
    let resumeFileName = initial?.resumeFileName ?? "resume.txt";

    if (resumeFile) {
      setReading(true);
      try {
        const fd = new FormData();
        fd.append("file", resumeFile);
        const res = await fetch("/api/interview/resume-text", {
          method: "POST",
          body: fd,
        });
        const json = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) {
          setError(json.error || "Could not read resume file.");
          return;
        }
        parsedResume = json.text?.trim() ?? "";
        resumeFileName = resumeFile.name;
      } finally {
        setReading(false);
      }
    }

    if (!parsedResume) {
      setError("Upload your resume (PDF, DOCX, or TXT).");
      return;
    }

    setError(null);
    await onSubmit({
      name: trimmedName,
      email: trimmedEmail,
      phone: phone.trim(),
      location: location.trim(),
      linkedin: linkedin.trim(),
      github: github.trim(),
      targetTitles: targetTitles.trim(),
      skills: skills.trim(),
      workAuth,
      remoteOnly,
      experienceYears: experienceYears.trim(),
      resumeText: parsedResume,
      resumeFileName,
      careerPageUrls: careerPageUrls.trim(),
      autoAlign,
      minFitScore: Math.min(95, Math.max(30, Number(minFitScore) || 55)),
    });
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border-2 border-black bg-white p-5 shadow-[8px_8px_0_0_rgba(0,0,0,1)] sm:p-8"
    >
      <h2 className="text-xl font-black tracking-tight text-neutral-900">
        Candidate details
      </h2>
      <p className="mt-1 text-sm font-medium text-neutral-600">
        Upload your resume, then the agent searches public boards and company
        career pages and applies with a JD-aligned version of it.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fj-name">
          <input
            id="fj-name"
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Your name"
          />
        </Field>
        <Field label="Email" htmlFor="fj-email">
          <input
            id="fj-email"
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@email.com"
          />
        </Field>
        <Field label="Phone" htmlFor="fj-phone">
          <input
            id="fj-phone"
            className={fieldClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="+1 …"
          />
        </Field>
        <Field label="Location" htmlFor="fj-location">
          <input
            id="fj-location"
            className={fieldClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, country"
          />
        </Field>
        <Field label="LinkedIn" htmlFor="fj-linkedin">
          <input
            id="fj-linkedin"
            className={fieldClass}
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/…"
          />
        </Field>
        <Field label="GitHub / portfolio" htmlFor="fj-github">
          <input
            id="fj-github"
            className={fieldClass}
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/…"
          />
        </Field>
        <Field
          label="Target titles"
          htmlFor="fj-titles"
          className="sm:col-span-2"
        >
          <input
            id="fj-titles"
            className={fieldClass}
            value={targetTitles}
            onChange={(e) => setTargetTitles(e.target.value)}
            placeholder="Software Engineer, Frontend, Full-stack"
          />
        </Field>
        <Field label="Skills" htmlFor="fj-skills" className="sm:col-span-2">
          <input
            id="fj-skills"
            className={fieldClass}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Node.js, Postgres"
          />
        </Field>
        <Field label="Work authorization" htmlFor="fj-auth">
          <select
            id="fj-auth"
            className={cn(fieldClass, "font-semibold")}
            value={workAuth}
            onChange={(e) => setWorkAuth(e.target.value)}
          >
            <option>Authorized to work</option>
            <option>Need sponsorship</option>
            <option>Remote / anywhere</option>
          </select>
        </Field>
        <Field label="Years of experience" htmlFor="fj-years">
          <input
            id="fj-years"
            className={fieldClass}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="3"
          />
        </Field>
        <Field
          label="Company career pages (optional)"
          htmlFor="fj-careers"
          className="sm:col-span-2"
        >
          <textarea
            id="fj-careers"
            rows={3}
            className={cn(fieldClass, "min-h-[96px]")}
            value={careerPageUrls}
            onChange={(e) => setCareerPageUrls(e.target.value)}
            placeholder="https://boards.greenhouse.io/openai&#10;https://jobs.lever.co/notion&#10;https://jobs.ashbyhq.com/linear"
          />
          <p className="mt-1 text-xs font-medium text-neutral-500">
            One URL per line. Greenhouse, Lever, Ashby, and Workday boards are
            read directly; other career pages are scanned for public job
            postings.
          </p>
        </Field>
        <div className="sm:col-span-2">
          <Label className="text-neutral-900">Resume</Label>
          <div className="mt-2 overflow-hidden rounded-xl border-2 border-black bg-white">
            <FileUpload
              accept=".pdf,.doc,.docx,.txt,application/pdf"
              onChange={(files) => setResumeFile(files[0] ?? null)}
            />
          </div>
          {resumeText && !resumeFile ? (
            <p className="mt-2 text-xs font-semibold text-emerald-800">
              Using previously parsed resume ({initial?.resumeFileName}).
            </p>
          ) : null}
        </div>
        <label className="flex items-start gap-3 rounded-xl border-2 border-black bg-[#fef9c3] p-3 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={autoAlign}
            onChange={(e) => setAutoAlign(e.target.checked)}
          />
          <span className="text-sm font-semibold text-neutral-900">
            If the resume is not aligned with the JD, automatically rewrite it
            (truthful phrasing + ATS keywords) before applying.
          </span>
        </label>
        <Field label="Minimum fit score to apply" htmlFor="fj-min">
          <input
            id="fj-min"
            type="number"
            min={30}
            max={95}
            className={fieldClass}
            value={minFitScore}
            onChange={(e) => setMinFitScore(Number(e.target.value))}
          />
        </Field>
        <label className="flex items-center gap-3 self-end pb-2">
          <input
            type="checkbox"
            className="size-4"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
          />
          <span className="text-sm font-semibold text-neutral-800">
            Remote roles preferred
          </span>
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={busy}
        className="mt-6 min-h-11 w-full border-2 border-black bg-neutral-950 font-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-neutral-800 sm:w-auto"
      >
        {reading
          ? "Reading resume…"
          : pending
            ? "Scanning jobs…"
            : "Find jobs & prepare agent"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-neutral-900">
        {label}
      </Label>
      {children}
    </div>
  );
}
