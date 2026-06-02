import Link from 'next/link';
import { ArrowRight, Film, Layers3, Plus, Settings, WalletCards } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { listProjectsForCurrentUser } from '@/lib/supabase/project-queries';

const statusLabel: Record<string, string> = {
  draft: 'Brouillon',
  uploaded: 'Video recue',
  queued: 'En file',
  transcribing: 'Transcription',
  planning: 'Plan de montage',
  rendering: 'Rendu',
  completed: 'Termine',
  failed: 'Erreur',
  cancelled: 'Annule',
};

const DashboardPage: React.FC = async () => {
  const { user, projects, credits } = await listProjectsForCurrentUser();
  const completedCount = projects.filter((project) => project.status === 'completed').length;
  const activeCount = projects.filter((project) => ['queued', 'transcribing', 'planning', 'rendering'].includes(project.status)).length;

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm text-neutral-400">Dashboard Edith</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Creative testing room</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
              Pilote tes rushs produit, suis les rendus Modal, et recupere les variantes TikTok/Reels pretes a tester.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
              <Link href="/settings/billing">
                <Settings className="size-4" />
                Parametres
              </Link>
            </Button>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="size-4" />
                Nouveau projet
              </Link>
            </Button>
          </div>
        </header>

        {!user && (
          <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
            Connecte-toi pour utiliser Supabase Auth, Storage et Postgres. Le mode mock reste disponible uniquement pour les tests locaux.
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Film className="mb-5 size-5 text-emerald-300" />
            <p className="text-3xl font-semibold">{projects.length}</p>
            <p className="mt-1 text-sm text-neutral-400">Projets</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Layers3 className="mb-5 size-5 text-emerald-300" />
            <p className="text-3xl font-semibold">{activeCount}</p>
            <p className="mt-1 text-sm text-neutral-400">Jobs actifs</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="mb-5 text-sm text-emerald-300">Exports</p>
            <p className="text-3xl font-semibold">{completedCount}</p>
            <p className="mt-1 text-sm text-neutral-400">Projets termines</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <WalletCards className="mb-5 size-5 text-emerald-300" />
            <p className="text-3xl font-semibold">{credits?.balance ?? 'Demo'}</p>
            <p className="mt-1 text-sm text-neutral-400">Credits disponibles</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <h2 className="text-lg font-semibold">Projets recents</h2>
              <Link href="/projects/new" className="text-sm text-emerald-300">
                Creer
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="p-10">
                <h3 className="text-xl font-semibold">Aucun rush transforme pour le moment</h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-400">
                  Commence par une video UGC ou une demo produit. Edith generera les lignes projet, variants et job en base.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/projects/new">Creer ma premiere variante</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="grid gap-4 p-5 transition hover:bg-white/[0.03] md:grid-cols-[1fr_140px_110px_32px] md:items-center">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="mt-1 text-sm text-neutral-400">
                        {project.preset} · {project.platform} · {project.output_format} · {project.variants_count} variantes
                      </p>
                    </div>
                    <span className="text-sm text-neutral-300">{statusLabel[project.status] ?? project.status}</span>
                    <span className="text-sm text-neutral-500">{new Date(project.created_at).toLocaleDateString('fr-FR')}</span>
                    <ArrowRight className="size-4 text-neutral-500" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="font-semibold">Pipeline actuel</h2>
              <ul className="mt-4 space-y-3 text-sm text-neutral-400">
                <li>Supabase Auth: pret</li>
                <li>Supabase Storage: upload direct</li>
                <li>Supabase Postgres: projets, variants, jobs</li>
                <li>Modal: endpoint configurable</li>
                <li>Stripe: mode non bloquant</li>
              </ul>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="font-semibold">Regle credits MVP</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-400">1 variante courte = 5 credits. Si `BILLING_DISABLED=true`, Edith laisse passer le rendu pour tester le pipeline.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
