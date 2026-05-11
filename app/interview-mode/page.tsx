import type { Metadata } from "next";
import InterviewLanding from "@/components/interviewmode/InterviewLanding";

export const metadata: Metadata = {
  title: "Interview Mode",
  description:
    "Set up a timed mock interview with your resume and target company—voice practice tailored to you.",
};

export default function InterviewModePage() {
  return (
    <div className="w-full max-w-none px-0 pt-0">
      <InterviewLanding />
    </div>
  );
}
