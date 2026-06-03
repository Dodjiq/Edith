# Quota Integration Plan

Status: proposal. Scope: integrate `apps/frontend/src/lib/quota.ts` into the
render trigger so plan limits are enforced before Modal is invoked and
counters move with successful job dispatch (not job completion).

## Render Flow With Quota Gates

```text
POST /api/render/start
       |
       v
  [1] auth.getUser()                           supabase server client
       |
       v
  [2] resolveUserPlan() + checkExportQuota()    NEW gate (quota.ts)
       |        |
       |        +-- ok:false reason='exceeded'           -> 402 Payment Required
       |        +-- ok:false reason='duration_too_long'  -> 403 Forbidden
       |        +-- ok:false reason='too_many_variants'  -> 403 Forbidden
       |        +-- ok:false reason='voiceover_*'        -> 403 Forbidden
       |        +-- ok:false reason='advanced_mode_*'    -> 403 Forbidden
       |
       v
  [3] legacy credit check (variantsCount * 5)   existing, keep for now
       |
       v
  [4] insert projects / project_assets / video_variants / render_jobs
       |
       v
  [5] reserve credits + credit_transactions     existing
       |
       v
  [6] startRenderJob() to Modal                 existing
       |
       v
  [7] incrementExportCounter()                  NEW (only if Modal accepted job)
       |
       v
  [8] respond with project/job/variants
```

## Concrete Patch For `apps/frontend/src/app/api/render/start/route.ts`

These are illustrative diff fragments. The agent that wires this up should
apply them inside the existing authenticated branch (the block guarded by
`if (user) { ... }`). No existing logic is removed; the quota gate slots in
before the credit reservation and the counter bump happens right after Modal
accepts the job.

### Imports

```ts
import {
  checkExportQuota,
  incrementExportCounter,
  shouldApplyWatermark,
} from '@/lib/quota';
```

### Step 2 — Gate before reserving credits

Insert this immediately after `const adminSupabase = createAdminClient();`
and BEFORE the existing legacy `availableCredits` check. The legacy block
stays in place until credits are fully retired.

```ts
const durationSeconds = Number(input.durationSeconds ?? 0);

const quota = await checkExportQuota(adminSupabase, user.id, {
  durationSeconds,
  variantsCount: input.variantsCount,
  voiceoverRequested: Boolean(input.voiceoverRequested),
  advancedModeRequested: Boolean(input.advancedModeRequested),
});

if (!quota.ok) {
  const status = quota.reason === 'exceeded' ? 402 : 403;
  return NextResponse.json(
    { error: 'quota_blocked', reason: quota.reason },
    { status },
  );
}

const plan = quota.plan;
const applyWatermark = shouldApplyWatermark(plan);
```

Notes:

- `durationSeconds`, `voiceoverRequested`, `advancedModeRequested` must be
  added to `startRenderRequestSchema`. If they are not yet on the request
  payload, derive `durationSeconds` from `project_assets.duration_seconds`
  after the asset upsert (move the gate to run after step [4] in that case).
- Use the admin client because RLS on `profiles` and `user_credits` blocks
  cross-row reads from the user session client.

### Response mapping

| `quota.reason`            | HTTP | Frontend behaviour                          |
| ------------------------- | ---- | ------------------------------------------- |
| `exceeded`                | 402  | Open upgrade modal, show plan comparison    |
| `duration_too_long`       | 403  | Toast: "Trim under N seconds to render"     |
| `too_many_variants`       | 403  | Toast: "Upgrade to render M+ variants"      |
| `voiceover_not_allowed`   | 403  | Toast: "Voiceover requires Pro+"            |
| `advanced_mode_required`  | 403  | Toast: "Advanced mode requires Agency"      |
| `plan_unknown`            | 403  | Generic error, log for ops                  |

### Step 6 — Pass watermark flag to Modal

Inside the existing `startRenderJob(...)` call, add the flag:

```ts
const modalJob = await startRenderJob({
  // ...existing fields...
  applyWatermark,
  planKey: plan.key,
});
```

The Modal client and the Python render worker must accept these new fields
in a follow-up change; ignore them on the worker side until the contract is
ready.

### Step 7 — Increment counter after Modal accepts the job

Place the increment inside the existing `try { const modalJob = await ... }`
block, AFTER the `if (!isRealModal) { ... } else { ... }` writeback succeeds
but BEFORE the `return NextResponse.json({ ... })`. This guarantees:

- We only count exports that Modal actually accepted.
- A Modal failure (`catch` branch) never bumps the counter — so retries are
  safe.

```ts
await incrementExportCounter(adminSupabase, user.id, 1);
```

For the mock branch (`!isRealModal`) increment by 1 as well so the counter
reflects what the user sees as a finished export.

## Open Questions

### Idempotency on render retries

If the user double-submits or the frontend retries on a transient 5xx after
Modal has already accepted the job, we will double-count. Mitigation:

- Derive a stable `render_job_id` client-side (UUID v4 attached to the
  request body) and persist it to `render_jobs.client_request_id` with a
  UNIQUE constraint.
- Before calling `incrementExportCounter`, check if `render_jobs.id` already
  has a `credits_counted_at timestamptz`. If set, skip. Otherwise update it
  atomically in the same statement as the counter bump.

This needs a follow-up migration: `client_request_id text unique` and
`credits_counted_at timestamptz` on `render_jobs`.

### Race condition on the counter

`incrementExportCounter` does read-modify-write. Two concurrent renders from
the same user can both read `monthly_exports_used = N` and both write
`N + 1`, losing one increment. Recommended fix:

```sql
-- supabase/migrations/00X_increment_user_exports_rpc.sql
create or replace function public.increment_user_exports(
  p_user_id uuid,
  p_delta integer default 1
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new_count integer;
begin
  update public.user_credits
     set monthly_exports_used = coalesce(monthly_exports_used, 0) + p_delta
   where user_id = p_user_id
   returning monthly_exports_used into v_new_count;

  return v_new_count;
end;
$$;

revoke all on function public.increment_user_exports(uuid, integer) from public, anon, authenticated;
```

Then `incrementExportCounter` can switch to:

```ts
await supabaseAdmin.rpc('increment_user_exports', {
  p_user_id: userId,
  p_delta: delta,
});
```

The current read-modify-write implementation is acceptable for the MVP
(single Modal worker, low concurrency), but the RPC swap is the cheapest
durable fix.

## Quick Manual Test Plan

Setup: three test users, one per plan (`free`, `pro`, `agency`).

1. **Free user — variant cap**
   - Send a render with `variantsCount: 2`.
   - Expect HTTP 403, `reason: 'too_many_variants'`.
   - Retry with `variantsCount: 1` and a 25s asset; expect 200.

2. **Pro user — variant cap relaxed**
   - Send a render with `variantsCount: 3` and a 55s asset.
   - Expect 200 and counter `monthly_exports_used` incremented by 1.
   - Send a render with `variantsCount: 4`; expect 403,
     `reason: 'too_many_variants'`.

3. **Free user — duration cap**
   - Send a render with a 45s asset.
   - Expect 403, `reason: 'duration_too_long'`.

4. **Agency user — advanced mode**
   - Send a render with `advancedModeRequested: true`.
   - Expect 200. Same payload on a Pro user must return 403,
     `reason: 'advanced_mode_required'`.

5. **Quota exhaustion**
   - As Free user, run 2 successful renders.
   - 3rd request expects 402, `reason: 'exceeded'`.

6. **Watermark**
   - Inspect Modal payload from steps 1 and 2: `applyWatermark` is `true`
     for Free, `false` for Pro/Agency.

7. **Counter rollover**
   - Manually set `monthly_exports_reset_at` to `now() - interval '1 day'`
     on the Free user; quota gate must treat used count as 0.
