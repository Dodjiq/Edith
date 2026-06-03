import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Check, CreditCard, X } from 'lucide-react';
import { Link, redirect } from '@/i18n/navigation';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { resolveUserPlan, getUsedExportsThisPeriod } from '@/lib/quota';
import PortalButton from './PortalButton';

type Props = { params: Promise<{ locale: string }> };

interface FeatureRow {
  labelKey:
    | 'features.duration'
    | 'features.variants'
    | 'features.voiceover'
    | 'features.watermark'
    | 'features.advanced_mode';
  value: string;
  isPositive: boolean | null;
}

const BillingSettingsPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('billing');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/auth/login', locale });
  }

  const userId = user!.id;
  const supabaseAdmin = createAdminClient();
  const plan = await resolveUserPlan(supabaseAdmin, userId);
  const usedExports = await getUsedExportsThisPeriod(supabaseAdmin, userId);
  const remainingExports = Math.max(0, plan.monthlyExports - usedExports);

  const { data: stripeCustomerRow } = await supabaseAdmin
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  const hasStripeCustomer = Boolean(
    (stripeCustomerRow as { stripe_customer_id?: string | null } | null)?.stripe_customer_id,
  );

  const isFreePlan = plan.key === 'free';
  const canShowPortal = !isFreePlan && hasStripeCustomer;

  const includedLabel = t('features.included');
  const notIncludedLabel = t('features.not_included');

  const features: FeatureRow[] = [
    {
      labelKey: 'features.duration',
      value: `${plan.maxDurationSeconds}s`,
      isPositive: null,
    },
    {
      labelKey: 'features.variants',
      value: String(plan.maxVariantsPerProject),
      isPositive: null,
    },
    {
      labelKey: 'features.voiceover',
      value: plan.voiceoverIncluded ? includedLabel : notIncludedLabel,
      isPositive: plan.voiceoverIncluded,
    },
    {
      labelKey: 'features.watermark',
      value: plan.watermark ? includedLabel : notIncludedLabel,
      isPositive: !plan.watermark,
    },
    {
      labelKey: 'features.advanced_mode',
      value: plan.advancedMode ? includedLabel : notIncludedLabel,
      isPositive: plan.advancedMode,
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <Link href="/settings" className="text-sm text-neutral-400">
            {t('section_label')}
          </Link>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
        </header>

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-400">
                {t('current_plan')}
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <span className="text-neutral-400">
                  {plan.priceEur === 0 ? '0 €' : `${plan.priceEur} €`}
                </span>
              </div>
            </div>
            <CreditCard className="size-6 text-emerald-300" aria-hidden />
          </div>

          <div className="mt-6 rounded-md bg-neutral-900 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-400">
              {t('monthly_quota')}
            </p>
            <p className="mt-2 text-base text-neutral-100">
              {t('quota_remaining', {
                used: usedExports,
                total: plan.monthlyExports,
                remaining: remainingExports,
              })}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full bg-emerald-400"
                style={{
                  width: `${Math.min(100, (usedExports / Math.max(1, plan.monthlyExports)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature.labelKey}
                className="flex items-center justify-between gap-3 rounded-md bg-neutral-900 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 text-neutral-300">
                  {feature.isPositive === true ? (
                    <Check className="size-4 text-emerald-300" aria-hidden />
                  ) : feature.isPositive === false ? (
                    <X className="size-4 text-amber-300" aria-hidden />
                  ) : null}
                  {t(feature.labelKey)}
                </span>
                <span className="text-neutral-100">{feature.value}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-start gap-3">
            {canShowPortal ? <PortalButton /> : null}
            {isFreePlan ? (
              <Button asChild>
                <Link href="/pricing">{t('upgrade')}</Link>
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
};

export default BillingSettingsPage;
