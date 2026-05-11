-- Interview Mode persistence (run in Supabase SQL editor or via CLI).
-- Requires SUPABASE_SERVICE_ROLE_KEY on the Next.js server for writes.

create table if not exists public.interview_mode_session (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  company text not null,
  resume_text text not null,
  resume_file_name text not null default 'resume',
  duration_minutes integer not null,
  mode text check (mode is null or mode in ('mock', 'roadmap')),
  debrief jsonb,
  ended_at bigint
);

create index if not exists interview_mode_session_clerk_user_id_idx
  on public.interview_mode_session (clerk_user_id);

create index if not exists interview_mode_session_created_at_idx
  on public.interview_mode_session (created_at desc);

comment on table public.interview_mode_session is 'Interview Mode funnel + debrief; written by Next.js using service role.';
