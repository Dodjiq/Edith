import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getDefaultPlan,
  getPlanByKey,
  getPlanByPriceId,
  type PlanConfig,
} from './plans';

// Result returned by checkExportQuota. When ok is true the plan and remaining count
// are surfaced so the caller can include them in API responses or forward them to Modal.
export type QuotaCheckResult =
  | { ok: true; plan: PlanConfig; remaining: number }
  | {
      ok: false;
      reason:
        | 'plan_unknown'
        | 'exceeded'
        | 'duration_too_long'
        | 'too_many_variants'
        | 'voiceover_not_allowed'
        | 'advanced_mode_required';
    };

// Resolve the active plan for a user. Priority order:
// 1. profiles.plan (manually set by admin or sync job)
// 2. stripe_subscriptions.price_id of the most recent active/trialing row
// 3. Fallback to the default free plan
export const resolveUserPlan = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanConfig> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();

  const profilePlanKey = (profile as { plan?: string | null } | null)?.plan;
  if (profilePlanKey) {
    const plan = getPlanByKey(profilePlanKey);
    if (plan) return plan;
  }

  const { data: sub } = await supabase
    .from('stripe_subscriptions')
    .select('price_id, status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  const stripePriceId = (sub as { price_id?: string | null } | null)?.price_id;
  if (stripePriceId) {
    const plan = getPlanByPriceId(stripePriceId);
    if (plan) return plan;
  }

  return getDefaultPlan();
};

// Read the monthly export counter. If monthly_exports_reset_at is in the past
// we treat the counter as already rolled over and report 0 used.
export const getUsedExportsThisPeriod = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<number> => {
  const { data } = await supabase
    .from('user_credits')
    .select('monthly_exports_used, monthly_exports_reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return 0;

  const row = data as {
    monthly_exports_used: number | null;
    monthly_exports_reset_at: string | null;
  };

  const resetAt = row.monthly_exports_reset_at
    ? new Date(row.monthly_exports_reset_at)
    : null;
  if (resetAt && resetAt < new Date()) return 0;

  return row.monthly_exports_used ?? 0;
};

// Input for the composite quota check. Caller computes durationSeconds from the
// asset metadata before calling. variantsCount mirrors the render request payload.
export interface QuotaCheckInput {
  durationSeconds: number;
  variantsCount: number;
  voiceoverRequested: boolean;
  advancedModeRequested: boolean;
}

// Composite gate for a render request. Order of checks is intentional:
// hard quota (exceeded) wins over plan-locked features so the user sees
// the most actionable error first (upgrade vs. tweak input).
export const checkExportQuota = async (
  supabase: SupabaseClient,
  userId: string,
  input: QuotaCheckInput,
): Promise<QuotaCheckResult> => {
  const plan = await resolveUserPlan(supabase, userId);
  const used = await getUsedExportsThisPeriod(supabase, userId);

  if (used >= plan.monthlyExports) {
    return { ok: false, reason: 'exceeded' };
  }
  if (input.durationSeconds > plan.maxDurationSeconds) {
    return { ok: false, reason: 'duration_too_long' };
  }
  if (input.variantsCount > plan.maxVariantsPerProject) {
    return { ok: false, reason: 'too_many_variants' };
  }
  if (input.voiceoverRequested && !plan.voiceoverIncluded) {
    return { ok: false, reason: 'voiceover_not_allowed' };
  }
  if (input.advancedModeRequested && !plan.advancedMode) {
    return { ok: false, reason: 'advanced_mode_required' };
  }

  return { ok: true, plan, remaining: plan.monthlyExports - used };
};

// Increment the monthly export counter. Caller MUST pass the service-role admin client.
export const incrementExportCounter = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  delta: number = 1,
): Promise<void> => {
  // Prefer atomic RPC (migration 004); fall back to RMW if it doesn't exist yet.
  const { error } = await supabaseAdmin.rpc('increment_user_exports', {
    p_user_id: userId,
    p_delta: delta,
  });

  if (!error) return;

  // Fallback: best-effort read-modify-write (race-prone, but DB still consistent eventually).
  const { data } = await supabaseAdmin
    .from('user_credits')
    .select('monthly_exports_used')
    .eq('user_id', userId)
    .maybeSingle();

  const current =
    (data as { monthly_exports_used: number | null } | null)?.monthly_exports_used ?? 0;

  await supabaseAdmin
    .from('user_credits')
    .update({ monthly_exports_used: current + delta })
    .eq('user_id', userId);
};

// Helper for the watermark policy. Cheap shim today; centralising it here means
// future tweaks (e.g. agency add-on toggles) only touch this module.
export const shouldApplyWatermark = (plan: PlanConfig): boolean => plan.watermark;
