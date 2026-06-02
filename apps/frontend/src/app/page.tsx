import Link from 'next/link';
import { ArrowRight, BadgeCheck, Film, Layers3, Play, Upload, Zap } from 'lucide-react';
import { Button } from '@/components/buttons/button';

const useCases = ['TikTok Ads', 'Reels Ads', 'Facebook Ads', 'Videos UGC', 'Demos produit', 'Avant / apres', 'COD / dropshipping', 'Tests creatifs'];

const presets = [
  {
    name: 'UGC dynamic',
    detail: 'Facecam, temoignage, rythme rapide, sous-titres dynamiques.',
  },
  {
    name: 'E-commerce ad',
    detail: 'Hook benefice, callouts produit, zooms et outro simple.',
  },
  {
    name: 'Product demo',
    detail: 'Etapes claires, focus produit et export vertical propre.',
  },
];

const Home: React.FC = () => {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Edith
          </Link>
          <div className="hidden items-center gap-6 text-sm text-neutral-400 md:flex">
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
            <Link href="/settings" className="hover:text-white">Settings</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/projects/new">Creer une variante</Link>
            </Button>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-neutral-300">
              <Zap className="size-4 text-emerald-300" />
              Machine a variantes publicitaires pour e-commerce
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Transforme tes videos produit en variantes publicitaires pretes a tester.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-neutral-300">
                Upload tes rushs, choisis un preset, donne une instruction, et Edith lance un pipeline Supabase
                + Modal pour produire des formats TikTok, Reels, Shorts et Facebook Ads.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/projects/new">
                  Creer ma premiere variante
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
                Upload Storage direct
              </div>
              <div className="flex items-center gap-2">
                <Layers3 className="size-4 text-emerald-300" />
                Variantes en base
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-emerald-300" />
                Rendu Modal + FFmpeg
              </div>
            </div>
          </div>

          <div className="relative rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40">
            <div className="absolute right-5 top-5 rounded-full bg-emerald-300 px-3 py-1 text-xs font-semibold text-neutral-950">
              3 variants queued
            </div>
            <div className="aspect-[9/16] rounded-md bg-neutral-900 p-4">
              <div className="flex h-full flex-col justify-between rounded-md border border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-950 p-4">
                <div className="rounded-md bg-emerald-300 px-3 py-2 text-center text-sm font-semibold text-neutral-950">
                  Ce produit peut changer ta routine
                </div>
                <div className="mx-auto flex size-24 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Play className="ml-1 size-10 text-white/70" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 rounded-full bg-white/80" />
                  <div className="h-3 w-4/5 rounded-full bg-white/50" />
                  <div className="h-3 w-2/3 rounded-full bg-white/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 border-t border-white/10 py-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm text-emerald-300">Workflow</p>
            <h2 className="mt-2 text-3xl font-semibold">Un pipeline, pas une timeline.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {['Upload', 'Preset', 'Modal render', 'Exports'].map((step, index) => (
              <div key={step} className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-neutral-500">0{index + 1}</p>
                <p className="mt-4 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-10 md:grid-cols-3">
          {presets.map((preset) => (
            <article key={preset.name} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <Film className="mb-5 size-5 text-emerald-300" />
              <h3 className="font-semibold">{preset.name}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{preset.detail}</p>
            </article>
          ))}
        </section>

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
