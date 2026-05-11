# Aviora

Aviora is a voice-enabled interview prep and learning companion: companion lessons, a dashboard for sessions, and **Interview Mode**—a timed mock interview flow with resume context, optional Supabase-backed history, and a post-session debrief.

---

## Features

- **Dashboard (signed-in)**: recent companion sessions, session cards, and CTA to create new companions.
- **Interview Mode** (`/interview-mode`): profile + resume upload, setup, mock vs roadmap track choice, voice session via Vapi, and debrief.
- **Auth**: Clerk (middleware protects non-public routes; public routes include `/`, `/landing`, sign-in/up).
- **Data**: Companion data uses Supabase with the anon key + Clerk token; Interview Mode session rows use a **server-only** admin client when configured.

---

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Dev server**: Webpack by default (`npm run dev`); Turbopack optional (`npm run dev:turbo`)
- **UI**: Tailwind CSS v4, Radix UI, Motion, Lottie, GSAP; 3D via Three.js / React Three Fiber where used
- **Auth**: Clerk (`@clerk/nextjs`)
- **Database**: Supabase (`@supabase/supabase-js`) — user-scoped client + optional service-role admin for Interview Mode writes
- **Voice**: Vapi (`@vapi-ai/web`)
- **Tooling**: ESLint (`eslint-config-next`)

---

## Getting started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` (never commit it). Values depend on which features you enable:

```bash
# Clerk — required for auth-protected areas
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Public site URL — SEO (metadataBase, sitemap, robots, JSON-LD). Use your production origin.
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Supabase — companions & general DB access (anon + Clerk JWT)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Supabase — Interview Mode server persistence (insert/update interview sessions)
# If omitted, Interview Mode still works using browser sessionStorage only.
SUPABASE_SERVICE_ROLE_KEY=

# Vapi — voice Interview Mode session
NEXT_PUBLIC_VAPI_WEB_TOKEN=
```

Clerk image domains (e.g. `img.clerk.com`) are already allowed in `next.config.ts` for `next/image`.

### Database (Interview Mode)

Server actions write to Supabase table **`interview_mode_session`** when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set:

- Row created after **Interview setup** (name, company, resume text, file name, duration).
- **`mode`** updated when the user picks **Mock interview** vs **Roadmap** track.
- **`debrief`** + **`ended_at`** updated when the session finishes.

Ensure your table and policies match what `lib/actions/interview-mode.actions.ts` expects (`clerk_user_id`, `name`, `company`, `resume_text`, `resume_file_name`, `duration_minutes`, `mode`, `debrief`, `ended_at`, `updated_at`, etc.).

### Run locally

```bash
npm run dev
```

Opens the Webpack dev server (recommended for stable HMR). For Turbopack:

```bash
npm run dev:turbo
```

If you hit **ChunkLoadError** or missing `.next/dev/...` manifests after clearing `.next`, stop the dev process, delete `.next`, and start again—avoid deleting `.next` while the server is running.

### Production build

```bash
npm run build
npm start
```

---

## NPM scripts

| Script           | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Dev server (Webpack)           |
| `npm run dev:turbo` | Dev server (Turbopack)      |
| `npm run build`  | Production build               |
| `npm run start`  | Run production server          |
| `npm run lint`   | ESLint                         |

---

## Project layout

| Path            | Purpose                                      |
| --------------- | -------------------------------------------- |
| `app/`          | App Router pages, API routes, layouts        |
| `components/`   | Shared UI and feature modules (`interviewmode/`, `home/`, etc.) |
| `lib/`          | Supabase clients, server actions, helpers    |
| `public/`       | Static assets (icons, images)                |
| `proxy.ts`      | Clerk middleware configuration               |

Notable routes:

- `/` — dashboard when signed in; marketing/landing flow when signed out
- `/interview-mode` — Interview Mode landing + setup
- `/interview-mode/session` — live voice session
- `/interview-mode/debrief` — debrief screen after session

---

## Vision & roadmap

Long-term goals include deeper question banks, rubric scoring, analytics, and job-seeker tooling (resume checklist, application tracker). Interview Mode’s voice loop, debrief, and optional Supabase persistence are the current foundation for that direction.

---

## Security notes

- Keep **`SUPABASE_SERVICE_ROLE_KEY`** server-only (never `NEXT_PUBLIC_*`).
- Do not commit `.env.local` or real keys. Optional screenshots live under `public/readme/` for docs only.
