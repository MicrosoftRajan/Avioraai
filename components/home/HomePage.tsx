import CardList from "@/components/CardList";
import Cards from "@/components/Cards";
import CTA from "@/components/CTA";
import { getUserSessions } from "@/lib/actions/companion.actions";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import React from "react";

/** Dashboard-style home (sessions + CTA). Caller should only render when appropriate. */
export default async function HomePage() {
  const user = await currentUser();
  const completedSessions = user
    ? await getUserSessions(user.id, 20)
    : [];

  return (
    <main>
      <h1 className="text-2xl underline">Dashboard Aviora</h1>

      {user && completedSessions.length > 0 ? (
        <section className="companions-grid w-full">
          {completedSessions.slice(0, 3).map((session, index) => {
            const id = String(session.id ?? "");
            const rowKey =
              session.sessionRowId != null &&
              String(session.sessionRowId) !== ""
                ? String(session.sessionRowId)
                : `${id || "row"}-${index}`;
            return (
              <Cards
                key={rowKey}
                id={id}
                name={String(session.name ?? "")}
                topic={String(session.topic ?? "")}
                subject={String(session.subject ?? "")}
                duration={Number(session.duration ?? 0)}
                color={getSubjectColor(String(session.subject ?? ""))}
              />
            );
          })}
        </section>
      ) : null}

      <section className="home-section">
        {!user ? (
          <div className="companion-list w-2/3 max-lg:w-full rounded-lg border-0 bg-muted/30 p-8 shadow-none">
            <h2 className="font-bold text-2xl">Recently Completed Sessions</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to see lessons you have finished and pick up where you left off.
            </p>
            <Link
              href="/sign-in"
              className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <CardList
            title="Recently Completed Sessions"
            description="Lessons you have completed, most recent first."
            companions={completedSessions}
            classNames="w-2/3 max-lg:w-full"
          />
        )}
        <CTA />
      </section>
    </main>
  );
}
