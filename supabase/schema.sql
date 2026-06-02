create extension if not exists "pgcrypto";

create type public.project_status as enum (
  'draft',
  'uploaded',
  'queued',
  'transcribing',
  'planning',
  'rendering',
  'completed',
  'failed',
  'cancelled'
);

create type public.asset_status as enum (
  'uploading',
  'uploaded',
  'processing',
  'ready',
  'failed'
);

create type public.variant_status as enum (
  'queued',
  'rendering',
  'completed',
  'failed',
  'cancelled'
);

create type public.credit_transaction_type as enum (
  'grant',
  'reserve',
  'spend',
  'refund',
  'adjustment'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status public.project_status not null default 'draft',
  preset text not null default 'ugc_dynamic',
  platform text not null default 'tiktok',
  output_format text not null default '9:16',
  language text not null default 'fr',
  instructions text not null default '',
  variants_count integer not null default 3 check (variants_count between 1 and 5),
  settings jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'source_video',
  file_name text not null,
  mime_type text not null,
  storage_bucket text not null default 'videos',
  storage_path text not null,
  status public.asset_status not null default 'uploaded',
  size_bytes bigint,
  duration_seconds numeric,
  width integer,
  height integer,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  asset_id uuid references public.project_assets(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'faster-whisper',
  language text not null default 'fr',
  full_text text,
  transcription_segments jsonb not null default '[]'::jsonb,
  confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.video_variants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  preset text not null,
  marketing_angle text,
  hook_text text,
  status public.variant_status not null default 'queued',
  storage_bucket text not null default 'videos',
  export_path text,
  thumbnail_path text,
  duration_seconds numeric,
  edit_plan jsonb not null default '{}'::jsonb,
  render_metadata jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid references public.project_assets(id) on delete set null,
  modal_job_id text,
  status public.project_status not null default 'queued',
  preset text not null,
  output_format text not null default '9:16',
  instructions text not null default '',
  variants_count integer not null default 3 check (variants_count between 1 and 5),
  credits_reserved integer not null default 0,
  render_metadata jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  monthly_allowance integer not null default 0,
  refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  render_job_id uuid references public.render_jobs(id) on delete set null,
  type public.credit_transaction_type not null,
  amount integer not null,
  balance_after integer,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stripe_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null,
  price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index project_assets_user_id_idx on public.project_assets(user_id);
create index project_assets_project_id_idx on public.project_assets(project_id);
create index transcriptions_user_id_idx on public.transcriptions(user_id);
create index transcriptions_project_id_idx on public.transcriptions(project_id);
create index video_variants_user_id_idx on public.video_variants(user_id);
create index video_variants_project_id_idx on public.video_variants(project_id);
create index render_jobs_user_id_idx on public.render_jobs(user_id);
create index render_jobs_project_id_idx on public.render_jobs(project_id);
create index credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index stripe_subscriptions_user_id_idx on public.stripe_subscriptions(user_id);

alter table public.projects enable row level security;
alter table public.project_assets enable row level security;
alter table public.transcriptions enable row level security;
alter table public.video_variants enable row level security;
alter table public.render_jobs enable row level security;
alter table public.user_credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.stripe_customers enable row level security;
alter table public.stripe_subscriptions enable row level security;

create policy "Users can select own projects." on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own projects." on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own projects." on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own projects." on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own assets." on public.project_assets for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own assets." on public.project_assets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own assets." on public.project_assets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own assets." on public.project_assets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own transcriptions." on public.transcriptions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own transcriptions." on public.transcriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own transcriptions." on public.transcriptions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own transcriptions." on public.transcriptions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own variants." on public.video_variants for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own variants." on public.video_variants for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own variants." on public.video_variants for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own variants." on public.video_variants for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own render jobs." on public.render_jobs for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own render jobs." on public.render_jobs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own render jobs." on public.render_jobs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own render jobs." on public.render_jobs for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own credits." on public.user_credits for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own credit transactions." on public.credit_transactions for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own stripe customers." on public.stripe_customers for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can select own stripe subscriptions." on public.stripe_subscriptions for select to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  2147483648,
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/x-msvideo']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can select own video objects." on storage.objects for select to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can insert own video objects." on storage.objects for insert to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update own video objects." on storage.objects for update to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete own video objects." on storage.objects for delete to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
