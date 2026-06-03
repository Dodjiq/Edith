import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/buttons/button';
import { Link } from '@/i18n/navigation';
import CheckoutButton from './CheckoutButton';
import type { PlanKey } from '@/lib/plans';

type Props = { params: Promise<{ locale: string }> };

const planKeys: readonly PlanKey[] = ['free', 'starter', 'pro', 'agency'] as const;

const PricingPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pricing');

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="max-w-2xl">
          <Link href="/" className="text-sm text-neutral-400">
            Edith
          </Link>
          <h1 className="mt-4 text-4xl font-semibold">{t('title')}</h1>
          <p className="mt-3 text-neutral-400">{t('subtitle')}</p>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          {planKeys.map((key) => (
            <article key={key} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-semibold">{t(`plans.${key}.name`)}</h2>
              <p className="mt-3 text-2xl font-semibold">{t(`plans.${key}.price`)}</p>
              <p className="mt-3 text-sm text-emerald-300">{t(`plans.${key}.credits`)}</p>
              <p className="mt-3 text-sm text-neutral-400">{t(`plans.${key}.description`)}</p>
              {key === 'free' ? (
                <Button asChild className="mt-6 w-full" variant="outline">
                  <Link href="/auth/register">{t('cta')}</Link>
                </Button>
              ) : (
                <CheckoutButton planKey={key} label={t('cta')} isPrimary={key === 'pro'} />
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default PricingPage;
