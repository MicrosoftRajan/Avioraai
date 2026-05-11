"use client";

import ScreeningJDPanel from "@/components/interviewmode/ScreeningJDPanel";
import type { InterviewSessionPayload } from "@/lib/interview-session-storage";
import { INTERVIEW_SESSION_KEY } from "@/lib/interview-session-storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InterviewScreeningPage() {
  const router = useRouter();
  const [session, setSession] = useState<InterviewSessionPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(INTERVIEW_SESSION_KEY);
    if (!raw) {
      router.replace("/interview-mode");
      return;
    }
    try {
      const p = JSON.parse(raw) as InterviewSessionPayload;
      if (p.roundStage !== "screening") {
        router.replace("/interview-mode");
        return;
      }
      setSession(p);
    } catch {
      router.replace("/interview-mode");
    }
  }, [router]);

  if (!session) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-neutral-600">
        <p className="text-sm font-medium">Loading screening…</p>
        <Link href="/interview-mode" className="text-sm font-bold underline">
          Back
        </Link>
      </div>
    );
  }

  return <ScreeningJDPanel session={session} />;
}
