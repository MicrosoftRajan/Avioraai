import { heuristicJdMatch } from "@/lib/jd-match-heuristic";
import { fetchGreenhouseJobDescription } from "./job-sources";
import { alignResumeToJd } from "./resume-align";
import type { ApplyEvent, FindJobProfile, NormalizedJob } from "./types";

async function jobDescription(job: NormalizedJob): Promise<string> {
  if (job.description.trim().length > 280) return job.description;
  if (job.ats === "greenhouse" && job.atsBoard && job.atsJobId) {
    try {
      const full = await fetchGreenhouseJobDescription(job.atsBoard, job.atsJobId);
      if (full.length > 40) return full;
    } catch {
      /* keep snippet */
    }
  }
  return job.description || `${job.title} at ${job.company}. ${job.location}`;
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { first: parts[0] || "Candidate", last: parts[0] || "Applicant" };
  }
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export async function applyViaLever(input: {
  board: string;
  jobId: string;
  profile: FindJobProfile;
  resumeText: string;
  coverLetter: string;
}): Promise<{ ok: boolean; message: string }> {
  const form = new FormData();
  form.set("name", input.profile.name);
  form.set("email", input.profile.email);
  if (input.profile.phone) form.set("phone", input.profile.phone);
  if (input.profile.github) form.set("urls[GitHub]", input.profile.github);
  if (input.profile.linkedin) form.set("urls[LinkedIn]", input.profile.linkedin);
  form.set("comments", input.coverLetter.slice(0, 8_000));
  form.set("silent", "true");
  const blob = new Blob([input.resumeText], { type: "text/plain" });
  form.set(
    "resume",
    blob,
    input.profile.resumeFileName.replace(/\.[^.]+$/, "") + ".txt",
  );

  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(input.board)}/${encodeURIComponent(input.jobId)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
      headers: { "User-Agent": "AvioraFindJob/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok) {
      return { ok: true, message: "Submitted through Lever’s public apply API." };
    }
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      message: `Lever apply returned ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Lever apply failed",
    };
  }
}

export async function applyViaGreenhouse(input: {
  board: string;
  jobId: string;
  profile: FindJobProfile;
  resumeText: string;
  coverLetter: string;
}): Promise<{ ok: boolean; message: string }> {
  const { first, last } = splitName(input.profile.name);
  const form = new FormData();
  form.set("first_name", first);
  form.set("last_name", last);
  form.set("email", input.profile.email);
  if (input.profile.phone) form.set("phone", input.profile.phone);
  form.set("cover_letter_text", input.coverLetter.slice(0, 8_000));
  const blob = new Blob([input.resumeText], { type: "text/plain" });
  form.set(
    "resume",
    blob,
    input.profile.resumeFileName.replace(/\.[^.]+$/, "") + ".txt",
  );

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(input.board)}/jobs/${encodeURIComponent(input.jobId)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
      headers: { "User-Agent": "AvioraFindJob/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok) {
      return {
        ok: true,
        message: "Submitted through Greenhouse’s public job-board API.",
      };
    }
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      message: `Greenhouse apply returned ${res.status}${text ? `: ${text.slice(0, 160)}` : ""}`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Greenhouse apply failed",
    };
  }
}

export async function runAutoApply(input: {
  profile: FindJobProfile;
  jobs: NormalizedJob[];
  emit: (event: ApplyEvent) => void;
}): Promise<void> {
  const { profile, jobs, emit } = input;
  emit({ type: "start", total: jobs.length });

  let submitted = 0;
  let ready = 0;
  let failed = 0;

  for (const job of jobs) {
    emit({
      type: "job_start",
      jobId: job.id,
      title: job.title,
      company: job.company,
      applyUrl: job.applyUrl || job.url,
    });

    try {
      const jd = await jobDescription(job);
      let resumeForApply = profile.resumeText;
      let coverLetter = "";
      let aligned = false;
      let fit = heuristicJdMatch(profile.resumeText, jd).fitScore;
      emit({ type: "score", jobId: job.id, fitScore: fit, title: job.title, company: job.company });

      if (fit < profile.minFitScore && !profile.autoAlign) {
        emit({
          type: "skipped",
          jobId: job.id,
          title: job.title,
          company: job.company,
          fitScore: fit,
          message: `Fit ${fit} is below your minimum (${profile.minFitScore}) and auto-align is off.`,
          applyUrl: job.applyUrl || job.url,
        });
        continue;
      }

      if (profile.autoAlign && fit < Math.max(profile.minFitScore, 78)) {
        emit({
          type: "aligning",
          jobId: job.id,
          fitScore: fit,
          title: job.title,
          company: job.company,
        });
        const result = await alignResumeToJd({
          resumeText: profile.resumeText,
          jobDescription: jd,
          company: job.company,
          title: job.title,
          profile,
        });
        resumeForApply = result.alignedResume;
        coverLetter = result.coverLetter;
        aligned = true;
        fit = result.fitScoreAfter;
        emit({
          type: "aligned",
          jobId: job.id,
          title: job.title,
          company: job.company,
          fitScore: fit,
          aligned: true,
          alignedResume: result.alignedResume,
          coverLetter: result.coverLetter,
          changes: result.changes,
        });
      } else if (!coverLetter) {
        coverLetter = `Dear ${job.company} hiring team,\n\nPlease find my resume for the ${job.title} role.\n\nSincerely,\n${profile.name}`;
      }

      if (fit < profile.minFitScore) {
        emit({
          type: "skipped",
          jobId: job.id,
          title: job.title,
          company: job.company,
          fitScore: fit,
          aligned,
          alignedResume: aligned ? resumeForApply : undefined,
          coverLetter,
          message: `Still below minimum fit (${profile.minFitScore}) after alignment.`,
          applyUrl: job.applyUrl || job.url,
        });
        continue;
      }

      emit({
        type: "applying",
        jobId: job.id,
        title: job.title,
        company: job.company,
        fitScore: fit,
        applyUrl: job.applyUrl || job.url,
      });

      if (job.ats === "lever" && job.atsBoard && job.atsJobId) {
        const lever = await applyViaLever({
          board: job.atsBoard,
          jobId: job.atsJobId,
          profile,
          resumeText: resumeForApply,
          coverLetter,
        });
        if (lever.ok) {
          submitted += 1;
          emit({
            type: "applied",
            jobId: job.id,
            title: job.title,
            company: job.company,
            fitScore: fit,
            aligned,
            alignedResume: resumeForApply,
            coverLetter,
            method: "lever_api",
            applyUrl: job.applyUrl || job.url,
            message: lever.message,
          });
          continue;
        }
      }

      if (job.ats === "greenhouse" && job.atsBoard && job.atsJobId) {
        const gh = await applyViaGreenhouse({
          board: job.atsBoard,
          jobId: job.atsJobId,
          profile,
          resumeText: resumeForApply,
          coverLetter,
        });
        if (gh.ok) {
          submitted += 1;
          emit({
            type: "applied",
            jobId: job.id,
            title: job.title,
            company: job.company,
            fitScore: fit,
            aligned,
            alignedResume: resumeForApply,
            coverLetter,
            method: "greenhouse_api",
            applyUrl: job.applyUrl || job.url,
            message: gh.message,
          });
          continue;
        }
      }

      ready += 1;
      emit({
        type: "ready",
        jobId: job.id,
        title: job.title,
        company: job.company,
        fitScore: fit,
        aligned,
        alignedResume: resumeForApply,
        coverLetter,
        method: "apply_link",
        applyUrl: job.applyUrl || job.url,
        message:
          "Tailored packet is ready. This board does not expose a public apply API, so open the official apply link.",
      });
    } catch (e) {
      failed += 1;
      emit({
        type: "error",
        jobId: job.id,
        title: job.title,
        company: job.company,
        message: e instanceof Error ? e.message : "Apply step failed",
        applyUrl: job.applyUrl || job.url,
      });
    }
  }

  emit({ type: "done", submitted, ready, failed, total: jobs.length });
}
