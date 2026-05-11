import HomePage from "@/components/home/HomePage";
import NeobrutalLanding from "@/components/landing/NeobrutalLanding";
import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";

/** Homepage SEO (same route serves dashboard when signed in). */
export const metadata: Metadata = {
  title: "Interview prep & AI companions",
  description:
    "Mock interviews powered by voice AI, resume-aware questions, and learning companions—built for job seekers who want realistic practice.",
};

export default async function Page() {
  const user = await currentUser();
  if (user) {
    return <HomePage />;
  }

  return (
    <main className="mx-0 flex w-full max-w-none flex-col gap-0 bg-transparent px-0 pt-0">
      <NeobrutalLanding />
    </main>
  );
}
