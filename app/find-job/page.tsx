import type { Metadata } from "next";
import FindJobApp from "@/components/find-job/FindJobApp";

export const metadata: Metadata = {
  title: "Find Job",
  description:
    "Search public job boards and company career pages, auto-align your resume to each JD, and run a real-time auto-apply agent.",
};

export default function FindJobPage() {
  return <FindJobApp />;
}
