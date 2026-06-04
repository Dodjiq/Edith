-- 003_render_idempotency.sql
-- Date: 2026-06-04
-- Purpose: Prevent double-counting exports on render retries by adding a
-- client-supplied request id that uniquely identifies a render invocation.

alter table public.render_jobs
  add column if not exists client_request_id text;

create unique index if not exists render_jobs_user_client_request_id_uniq
  on public.render_jobs(user_id, client_request_id)
  where client_request_id is not null;

-- Track whether the export quota counter has already been charged for this job.
alter table public.render_jobs
  add column if not exists credits_counted_at timestamptz;

create index if not exists render_jobs_credits_counted_at_idx
  on public.render_jobs(credits_counted_at);

-- end migration
