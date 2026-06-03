import { CheckCircle2, CreditCard, Database, Shield, Video, Workflow } from 'lucide-react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/buttons/button';
import { SignOutButton } from '@/components/SignOutButton';
import { getCurrentUser } from '@/lib/supabase/project-queries';

type Props = { params: Promise<{ locale: string }> };

const SettingsPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('settings');
  const { user } = await getCurrentUser();

  const runtimeChecks = [
    { key: 'supabase_url', value: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    { key: 'supabase_publishable', value: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) },
    { key: 'service_role', value: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { key: 'modal_endpoint', value: Boolean(process.env.MODAL_RENDER_ENDPOINT_URL) },
    { key: 'modal_webhook', value: Boolean(process.env.MODAL_WEBHOOK_SECRET) },
    { key: 'stripe_key', value: Boolean(process.env.STRIPE_SECRET_KEY) },
  ] as const;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <Link href="/dashboard" className="text-sm text-neutral-400">
              {t('back')}
            </Link>
            <h1 className="mt-2 text-4xl font-semibold">{t('title')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              {t('subtitle')}
            </p>
          </div>
          {user && (
            <div className="flex flex-wrap gap-3">
              <SignOutButton variant="outline" />
            </div>
          )}
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Shield className="mb-4 size-5 text-emerald-300" />
            <h2 className="font-semibold">{t('account.title')}</h2>
            <p className="mt-2 text-sm text-neutral-400">{user?.email ?? t('account.disconnected')}</p>
            <Button asChild className="mt-5" variant="outline">
              <Link href={user ? '/dashboard' : '/auth/login'}>
                {user ? t('account.view_dashboard') : t('account.sign_in')}
              </Link>
            </Button>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <CreditCard className="mb-4 size-5 text-emerald-300" />
            <h2 className="font-semibold">{t('billing.title')}</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {process.env.BILLING_DISABLED === 'false' ? t('billing.stripe_active') : t('billing.stripe_disabled')}
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/settings/billing">{t('billing.portal')}</Link>
            </Button>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Workflow className="mb-4 size-5 text-emerald-300" />
            <h2 className="font-semibold">{t('render.title')}</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {process.env.ENABLE_REAL_MODAL === 'true' ? t('render.modal_active') : t('render.modal_mock')}
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/projects/new">{t('render.test_render')}</Link>
            </Button>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-5 text-lg font-semibold">{t('runtime_config')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {runtimeChecks.map((check) => (
                <div key={check.key} className="flex items-center justify-between rounded-md bg-neutral-900 px-4 py-3">
                  <span className="text-sm text-neutral-300">{t(`checks.${check.key}`)}</span>
                  <span className={check.value ? 'text-emerald-300' : 'text-amber-300'}>
                    {check.value ? t('runtime.configured') : t('runtime.missing')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <Database className="mb-4 size-5 text-emerald-300" />
              <h2 className="font-semibold">{t('supabase.title')}</h2>
              <p className="mt-2 text-sm text-neutral-400">{t('supabase.detail')}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <Video className="mb-4 size-5 text-emerald-300" />
              <h2 className="font-semibold">{t('modal.title')}</h2>
              <p className="mt-2 text-sm text-neutral-400">{t('modal.detail')}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <CheckCircle2 className="mb-4 size-5 text-emerald-300" />
              <h2 className="font-semibold">{t('security.title')}</h2>
              <p className="mt-2 text-sm text-neutral-400">{t('security.detail')}</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default SettingsPage;
