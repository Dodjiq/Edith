-- 002_plans_quota.sql
-- Date: 2026-06-03
-- Purpose: Add plan identity (public.profiles + plan_key enum), monthly export
-- counter columns on user_credits, and auto-init triggers so every new auth user
-- gets a profile row and a user_credits row with the Free plan defaults.
-- Idempotent where possible. Apply manually in the Supabase SQL Editor.

-- Enum for plan keys (matches apps/frontend/src/lib/plans.ts PlanKey).
create type public.plan_key as enum ('free', 'starter', 'pro', 'agency');

-- Profile table keyed on auth.users — stores plan (denormalized from subscription).
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan public.plan_key not null default 'free',
  shop_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_plan_idx on public.profiles(plan);

alter table public.profiles enable row level security;

create policy "Users can select own profile." on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can update own profile." on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Add monthly export counter columns to user_credits.
alter table public.user_credits
  add column if not exists monthly_exports_used integer not null default 0 check (monthly_exports_used >= 0),
  add column if not exists monthly_exports_reset_at timestamptz;

-- Trigger to auto-create profile + user_credits on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, shop_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'shop_name', null))
  on conflict (user_id) do nothing;

  insert into public.user_credits (user_id, balance, monthly_allowance, refreshed_at)
  values (new.id, 0, 2, now())  -- Free plan default: 2 exports.
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for profiles.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Backfill profiles for any pre-existing auth.users.
insert into public.profiles (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

insert into public.user_credits (user_id, balance, monthly_allowance, refreshed_at)
select id, 0, 2, now() from auth.users
on conflict (user_id) do nothing;

-- end migration
