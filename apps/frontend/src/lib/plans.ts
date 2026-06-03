// Plan configuration for Edith subscriptions.
// Single source of truth for limits used by both the pricing page and server-side gates.
// Stripe price IDs are resolved through env vars to keep secrets out of the repo.

export type PlanKey = 'free' | 'starter' | 'pro' | 'agency';

export interface PlanConfig {
  key: PlanKey;
  name: string;
  priceEur: number;
  // Env var name to read the Stripe price id from at runtime.
  // null for plans that do not hit Stripe (Free).
  stripePriceIdEnv: string | null;
  monthlyExports: number;
  maxDurationSeconds: number;
  maxVariantsPerProject: number;
  voiceoverIncluded: boolean;
  watermark: boolean;
  advancedMode: boolean;
  exportRetentionDays: number;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    key: 'free',
    name: 'Free',
    priceEur: 0,
    stripePriceIdEnv: null,
    monthlyExports: 2,
    maxDurationSeconds: 30,
    maxVariantsPerProject: 1,
    voiceoverIncluded: false,
    watermark: true,
    advancedMode: false,
    exportRetentionDays: 7,
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    priceEur: 9.99,
    stripePriceIdEnv: 'STRIPE_STARTER_PRICE_ID',
    monthlyExports: 10,
    maxDurationSeconds: 45,
    maxVariantsPerProject: 2,
    voiceoverIncluded: false,
    watermark: true,
    advancedMode: false,
    exportRetentionDays: 14,
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    priceEur: 19.99,
    stripePriceIdEnv: 'STRIPE_PRO_PRICE_ID',
    monthlyExports: 20,
    maxDurationSeconds: 60,
    maxVariantsPerProject: 3,
    voiceoverIncluded: true,
    watermark: false,
    advancedMode: false,
    exportRetentionDays: 30,
  },
  agency: {
    key: 'agency',
    name: 'Agency',
    priceEur: 49.99,
    stripePriceIdEnv: 'STRIPE_AGENCY_PRICE_ID',
    monthlyExports: 30,
    maxDurationSeconds: 90,
    maxVariantsPerProject: 5,
    voiceoverIncluded: true,
    watermark: false,
    advancedMode: true,
    exportRetentionDays: 90,
  },
};

export const PLAN_KEYS: readonly PlanKey[] = ['free', 'starter', 'pro', 'agency'] as const;

const isPlanKey = (value: string): value is PlanKey =>
  (PLAN_KEYS as readonly string[]).includes(value);

export const getPlanByKey = (key: string): PlanConfig | null => {
  if (!isPlanKey(key)) return null;
  return PLANS[key];
};

// Resolve a Stripe price id back to a plan config by checking each plan's env-backed price id.
// Returns null if the price id is unknown (orphan subscription, deleted price, env not set).
export const getPlanByPriceId = (stripePriceId: string): PlanConfig | null => {
  if (!stripePriceId) return null;

  for (const planKey of PLAN_KEYS) {
    const plan = PLANS[planKey];
    if (!plan.stripePriceIdEnv) continue;

    const envValue = process.env[plan.stripePriceIdEnv];
    if (envValue && envValue === stripePriceId) {
      return plan;
    }
  }

  return null;
};

// Convenience: the plan a user gets when they have no active paid subscription.
export const getDefaultPlan = (): PlanConfig => PLANS.free;

// Convenience for server-side gating. Returns whether a candidate value is allowed by the plan.
export const canRenderDuration = (plan: PlanConfig, durationSeconds: number): boolean =>
  durationSeconds <= plan.maxDurationSeconds;

export const canRenderVariants = (plan: PlanConfig, variantsCount: number): boolean =>
  variantsCount <= plan.maxVariantsPerProject;

export const hasExportQuotaRemaining = (plan: PlanConfig, usedThisPeriod: number): boolean =>
  usedThisPeriod < plan.monthlyExports;
