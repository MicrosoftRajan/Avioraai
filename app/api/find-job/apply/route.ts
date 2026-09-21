import { runAutoApply } from "@/lib/find-job/auto-apply";
import type {
  ApplyEvent,
  FindJobProfile,
  NormalizedJob,
} from "@/lib/find-job/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

type ApplyBody = {
  profile?: FindJobProfile;
  jobs?: NormalizedJob[];
};

function validProfile(p: FindJobProfile | undefined): p is FindJobProfile {
  if (!p) return false;
  return Boolean(
    p.name?.trim() &&
      p.email?.trim() &&
      p.resumeText?.trim() &&
      typeof p.minFitScore === "number",
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApplyBody;
    if (!validProfile(body.profile)) {
      return NextResponse.json(
        { error: "Name, email, and resume are required." },
        { status: 400 },
      );
    }
    const jobs = (body.jobs ?? []).slice(0, 12);
    if (!jobs.length) {
      return NextResponse.json(
        { error: "Select at least one job." },
        { status: 400 },
      );
    }

    const profile: FindJobProfile = {
      ...body.profile,
      minFitScore: Math.min(
        95,
        Math.max(30, Math.round(body.profile.minFitScore)),
      ),
      autoAlign: Boolean(body.profile.autoAlign),
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event: ApplyEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        };
        try {
          await runAutoApply({ profile, jobs, emit });
        } catch (e) {
          emit({
            type: "error",
            message: e instanceof Error ? e.message : "Auto-apply failed",
          });
          emit({ type: "done", submitted: 0, ready: 0, failed: jobs.length });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
