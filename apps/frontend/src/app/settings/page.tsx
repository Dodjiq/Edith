import Link from 'next/link';
import { CheckCircle2, CreditCard, Database, Shield, Video, Workflow } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { getCurrentUser } from '@/lib/supabase/project-queries';

const runtimeChecks = [
  { label: 'Supabase URL', value: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
  { label: 'Supabase publishable key', value: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) },
  { label: 'Service role server key', value: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
  { label: 'Modal endpoint URL', value: Boolean(process.env.MODAL_RENDER_ENDPOINT_URL) },
  { label: 'Modal webhook secret', value: Boolean(process.env.MODAL_WEBHOOK_SECRET) },
  { label: 'Stripe secret key', value: Boolean(process.env.STRIPE_SECRET_KEY) },
];

const SettingsPage: React.FC = async () => {
  const { user } = await getCurrentUser();

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-white/10 pb-8">
          <Link href="/dashboard" className="text-sm text-neutral-400">
            Dashboard
          </Link>
          <h1 className="mt-2 text-4xl font-semibold">Parametres Edith</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Controle l'etat du SaaS: compte, credits, Supabase, Modal, Stripe et securite.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Shield className="mb-4 size-5 text-emerald-300" />
            <h2 className="font-semibold">Compte</h2>
            <p className="mt-2 text-sm text-neutral-400">{user?.email ?? 'Non connecte'}</p>
            <Button asChild className="mt-5" variant="outline">
              <Link href={user ? '/dashboard' : '/auth/login'}>{user ? 'Voir le dashboard' : 'Se connecter'}</Link>
            </Button>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <CreditCard className="mb-4 size-5 text-emerald-300" />
            <h2 className="font-semibold">Billing</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {process.env.BILLING_DISABLED === 'false' ? 'Stripe actif' : 'Stripe desactive pour le MVP'}
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/settings/billing">Portail billing</Link>
            </Button>
          </article>

          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Workflow className="mb-4 size-5 text-emerald-300" />
            <h2 className="font-semibold">Rendu</h2>
            <p className="mt-2 text-sm text-neutral-400">
              {process.env.ENABLE_REAL_MODAL === 'true' ? 'Modal reel active' : 'Mode mock ou database active'}
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link href="/projects/new">Tester un rendu</Link>
            </Button>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-5 text-lg font-semibold">Configuration runtime</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {runtimeChecks.map((check) => (
                <div key={check.label} className="flex items-center justify-between rounded-md bg-neutral-900 px-4 py-3">
                  <span className="text-sm text-neutral-300">{check.label}</span>
                  <span className={check.value ? 'text-emerald-300' : 'text-amber-300'}>
                    {check.value ? 'Configure' : 'Manquant'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <Database className="mb-4 size-5 text-emerald-300" />
              <h2 className="font-semibold">Supabase</h2>
              <p className="mt-2 text-sm text-neutral-400">Auth, Postgres RLS et bucket prive `videos` sont la source de verite.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <Video className="mb-4 size-5 text-emerald-300" />
              <h2 className="font-semibold">Modal + FFmpeg</h2>
              <p className="mt-2 text-sm text-neutral-400">Les rendus lourds sont lances hors Cloudflare via endpoint Modal securise.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <CheckCircle2 className="mb-4 size-5 text-emerald-300" />
              <h2 className="font-semibold">Securite MVP</h2>
              <p className="mt-2 text-sm text-neutral-400">RLS active, Storage par dossier utilisateur, credits et Stripe ecrits par service role.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default SettingsPage;
