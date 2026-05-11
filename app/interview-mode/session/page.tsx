import type { Metadata } from "next";
import InterviewSession from "@/components/interviewmode/InterviewSession";

export const metadata: Metadata = {
  title: "Live mock interview",
  description:
    "Timed AI voice mock interview with resume-grounded questions and an optional coding workspace.",
};

export default function InterviewSessionPage() {
  return (
    <div className="w-full max-w-none px-0 pt-0">
      <InterviewSession />
    </div>
  );
}
