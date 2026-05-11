import type { Metadata } from "next";
import InterviewDebrief from "@/components/interviewmode/InterviewDebrief";

export const metadata: Metadata = {
  title: "Interview debrief",
  description:
    "Feedback and improvement themes after your mock interview session.",
};

export default function InterviewDebriefPage() {
  return (
    <div className="w-full max-w-none px-0 pt-0">
      <InterviewDebrief />
    </div>
  );
}
