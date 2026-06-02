import Link from 'next/link';
import { ArrowRight, BadgeCheck, Film, Sparkles, Upload, Zap } from 'lucide-react';
import { Button } from '@/components/buttons/button';

const useCases = ['TikTok Ads', 'Reels Ads', 'Facebook Ads', 'Videos UGC', 'Demos produit', 'Avant / apres', 'COD / dropshipping', 'Tests creatifs'];

const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Edith
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/projects/new">Créer une variante</Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300">
              <Sparkles className="size-4 text-emerald-300" />
              Monteur video IA pour e-commerce et dropshipping
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Transforme tes videos produit en variantes publicitaires prêtes à tester.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-neutral-300">
                Upload tes rushs, donne une instruction, et Edith génère automatiquement des videos courtes
                avec hooks, sous-titres, cuts, zooms et angles marketing.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/projects/new">
                  Créer ma première variante
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10">
                <Link href="/dashboard">Voir le dashboard</Link>
              </Button>
            </div>
            <div className="grid gap-3 text-sm text-neutral-300 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Upload className="size-4 text-emerald-300" />
                Upload video source
              </div>
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-emerald-300" />
                Presets ads MVP
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-emerald-300" />
                Exports prêts à tester
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40">
            <div className="aspect-[9/16] rounded-md bg-neutral-900 p-4">
              <div className="flex h-full flex-col justify-between rounded-md border border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-950 p-4">
                <div className="rounded-md bg-emerald-300 px-3 py-2 text-center text-sm font-semibold text-neutral-950">
                  Ce produit peut changer ta routine
                </div>
                <Film className="mx-auto size-20 text-white/30" />
                <div className="space-y-2">
                  <div className="h-3 rounded-full bg-white/80" />
                  <div className="h-3 w-4/5 rounded-full bg-white/50" />
                  <div className="h-3 w-2/3 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="pb-10">
          <div className="flex flex-wrap gap-2">
            {useCases.map((useCase) => (
              <span key={useCase} className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-300">
                {useCase}
              </span>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Home;
