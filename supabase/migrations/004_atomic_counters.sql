-- 004_atomic_counters.sql
-- Date: 2026-06-04
-- Purpose: Atomic RPC for incrementing monthly_exports_used + a helper
-- that resets the counter when the period boundary is crossed.

create or replace function public.increment_user_exports(p_user_id uuid, p_delta integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.user_credits(user_id, balance, monthly_exports_used, monthly_exports_reset_at)
  values (p_user_id, 0, greatest(p_delta, 0), now() + interval '1 month')
  on conflict (user_id) do update
    set monthly_exports_used = case
      when public.user_credits.monthly_exports_reset_at is null
        or public.user_credits.monthly_exports_reset_at < now()
      then greatest(p_delta, 0)
      else public.user_credits.monthly_exports_used + greatest(p_delta, 0)
    end,
    monthly_exports_reset_at = case
      when public.user_credits.monthly_exports_reset_at is null
        or public.user_credits.monthly_exports_reset_at < now()
      then now() + interval '1 month'
      else public.user_credits.monthly_exports_reset_at
    end,
    updated_at = now()
  returning monthly_exports_used into new_count;

  return new_count;
end;
$$;

-- Allow authenticated callers (service-role) to invoke. (Service-role bypasses RLS anyway.)
grant execute on function public.increment_user_exports(uuid, integer) to authenticated, service_role;

-- end migration
