-- Scraped job listings for Find Job (run in Supabase SQL editor or via CLI).
-- Written by Next.js using the service role; the anon key has no access.

create table if not exists public.scraped_jobs (
  id text primary key,
  title text not null,
  company text not null,
  location text not null default '',
  country text,
  experience_level text,
  remote boolean not null default false,
  url text not null,
  apply_url text not null,
  description text not null default '',
  source text not null,
  source_label text not null,
  posted_at text,
  ats text not null default 'other',
  ats_board text,
  ats_job_id text,
  tags text[],
  featured_company text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scraped_jobs_last_seen_at_idx
  on public.scraped_jobs (last_seen_at desc);

create index if not exists scraped_jobs_source_idx
  on public.scraped_jobs (source);

create index if not exists scraped_jobs_featured_company_idx
  on public.scraped_jobs (featured_company);

create index if not exists scraped_jobs_posted_at_idx
  on public.scraped_jobs (posted_at desc);

comment on table public.scraped_jobs is
  'Normalized career-page and job-board listings scraped by Find Job; upserted by Next.js using the service role.';

alter table public.scraped_jobs enable row level security;

create or replace function public.scraped_jobs_touch()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if tg_op = 'UPDATE' then
    new.first_seen_at = old.first_seen_at;
  end if;
  return new;
end;
$$;

drop trigger if exists scraped_jobs_touch on public.scraped_jobs;
create trigger scraped_jobs_touch
  before insert or update on public.scraped_jobs
  for each row
  execute procedure public.scraped_jobs_touch();
