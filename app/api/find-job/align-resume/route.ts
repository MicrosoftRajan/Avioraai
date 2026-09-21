import { alignResumeToJd } from "@/lib/find-job/resume-align";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 45;

type AlignBody = {
  resumeText?: string;
  jobDescription?: string;
  company?: string;
  title?: string;
  name?: string;
  skills?: string;
  targetTitles?: string;
  location?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AlignBody;
    const resumeText = (body.resumeText ?? "").trim();
    const jobDescription = (body.jobDescription ?? "").trim();
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: "Resume and job description are required." },
        { status: 400 },
      );
    }

    const result = await alignResumeToJd({
      resumeText,
      jobDescription,
      company: (body.company ?? "the employer").trim(),
      title: (body.title ?? "this role").trim(),
      profile: {
        name: (body.name ?? "Candidate").trim(),
        skills: (body.skills ?? "").trim(),
        targetTitles: (body.targetTitles ?? "").trim(),
        location: (body.location ?? "").trim(),
      },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Align failed." }, { status: 500 });
  }
}
