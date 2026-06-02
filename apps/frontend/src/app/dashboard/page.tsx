import Link from 'next/link';
import { Film, Plus, WalletCards } from 'lucide-react';
import { Button } from '@/components/buttons/button';

const DashboardPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-neutral-400">Dashboard Edith</p>
            <h1 className="text-3xl font-semibold">Variantes publicitaires</h1>
          </div>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="size-4" />
              Nouveau projet
            </Link>
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <Film className="mb-4 size-5 text-emerald-300" />
            <p className="text-2xl font-semibold">0</p>
            <p className="text-sm text-neutral-400">Projets réels connectés</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <WalletCards className="mb-4 size-5 text-emerald-300" />
            <p className="text-2xl font-semibold">Mode démo</p>
            <p className="text-sm text-neutral-400">Crédits mockés tant que Stripe est désactivé</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="mb-4 text-sm text-emerald-300">Pipeline</p>
            <p className="text-2xl font-semibold">Mock prêt</p>
            <p className="text-sm text-neutral-400">Supabase + Modal à brancher</p>
          </div>
        </section>

        <section className="rounded-lg border border-dashed border-white/15 p-10 text-center">
          <h2 className="text-xl font-semibold">Crée ton premier test créatif</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-400">
            Upload ta vidéo produit, choisis un preset, ajoute une instruction, puis génère des variantes ads.
          </p>
          <Button asChild className="mt-6">
            <Link href="/projects/new">Créer ma première variante</Link>
          </Button>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
