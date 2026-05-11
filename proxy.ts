import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import {
  MARK_RETURNING_SEARCH_PARAM,
  RETURNING_VISITOR_COOKIE,
} from "@/lib/first-visit";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/landing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.get(MARK_RETURNING_SEARCH_PARAM) === "1"
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(MARK_RETURNING_SEARCH_PARAM);
    const response = NextResponse.redirect(url);
    response.cookies.set(RETURNING_VISITOR_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

