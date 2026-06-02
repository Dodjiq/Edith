import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Captions,
  Clapperboard,
  Crop,
  Download,
  Film,
  Gauge,
  MessageSquareText,
  Play,
  Scissors,
  Upload,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/buttons/button';

const capabilities = [
  {
    icon: MessageSquareText,
    title: 'Instructions prompt',
    detail: 'Brief naturel: angle marketing, ton, hooks, rythme et format attendu.',
  },
  {
    icon: Upload,
    title: 'Upload produit',
    detail: 'Rush UGC, demo, temoignage ou packshot envoye directement vers Supabase Storage.',
  },
  {
    icon: Captions,
    title: 'Captions ads',
    detail: 'Sous-titres courts, lisibles, penses pour TikTok, Reels, Shorts et Facebook Ads.',
  },
  {
    icon: Scissors,
    title: 'Cuts rapides',
    detail: 'Suppression des longueurs, jump cuts et structure orientee attention.',
  },
  {
    icon: Crop,
    title: 'Formats sociaux',
    detail: 'Exports 9:16, 1:1 et 16:9 sans demander a Cloudflare de rendre la video.',
  },
  {
    icon: Wand2,
    title: 'Angles creatifs',
    detail: 'Variantes par benefice, preuve sociale, probleme-solution ou demo produit.',
  },
  {
    icon: Gauge,
    title: 'Jobs Modal',
    detail: 'FFmpeg et faster-whisper tournent sur Modal, loin du frontend et des API legeres.',
  },
  {
    icon: Download,
    title: 'Exports prets',
    detail: 'Chaque variante revient dans le dashboard avec statut, preview et telechargement.',
  },
];

const presets = [
  ['ugc_dynamic', 'UGC dynamique', 'Facecam, temoignage, rythme rapide, hook fort et captions lisibles.'],
  ['ecommerce_ad', 'E-commerce ad', 'Callouts produit, zooms, benefices, format vertical et outro simple.'],
  ['product_demo', 'Product demo', 'Etapes propres, focus produit, textes explicatifs et cuts nets.'],
];

const timeline = ['Upload', 'Preset', 'Prompt', 'Render', 'Exports'];

const Home = () => {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-[#f4f1ed]">
      <section className="relative mx-auto min-h-screen max-w-7xl px-5 pb-16 pt-6 sm:px-8 lg:px-10">
        <div className="pointer-events-none absolute -left-24 top-0 h-28 w-96 rotate-12 rounded-full border border-white/[0.08] bg-[#2b1714]/40 blur-sm" />
        <div className="pointer-events-none absolute -right-20 top-20 h-20 w-72 rotate-[24deg] rounded-full border border-white/[0.08] bg-[#342522]/80 blur-sm" />
        <div className="pointer-events-none absolute bottom-8 right-[-12rem] h-32 w-[34rem] -rotate-12 rounded-[2rem] border border-white/[0.06] bg-[#1d1b16]" />

        <nav className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
              <Clapperboard className="size-4" />
            </span>
            Edith
          </Link>
          <div className="hidden items-center gap-8 text-xs text-[#8c8580] md:flex">
            <Link href="/pricing" className="transition hover:text-[#f4f1ed]">
              Pricing
            </Link>
            <Link href="/dashboard" className="transition hover:text-[#f4f1ed]">
              Dashboard
            </Link>
            <Link href="/settings" className="transition hover:text-[#f4f1ed]">
              Settings
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden h-9 rounded-full px-4 text-[#d7d0ca] hover:bg-white/[0.06] hover:text-white sm:inline-flex">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild className="h-9 rounded-full bg-[#f1ece6] px-4 text-[#130f0d] hover:bg-white">
              <Link href="/projects/new">
                Creer
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center pb-16 pt-24 text-center md:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[11px] text-[#b8aaa2] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="grid size-5 place-items-center rounded-full bg-[#2c1815] text-[#efb3a8]">
              <Wand2 className="size-3" />
            </span>
            AI ad variant engine for e-commerce
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] text-[#f7f3ee] md:text-7xl lg:text-8xl">
            Transforme tes rushs produit en videos ads.
            <span className="text-[#e7a49b]">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-[#9f9690] md:text-lg">
            Upload une video brute, donne une instruction, et Edith genere des variantes courtes avec hooks,
            sous-titres, cuts, zooms et angles marketing prets a tester.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-[#f1ece6] px-6 text-[#100d0b] shadow-[0_0_42px_rgba(194,76,47,0.22)] hover:bg-white">
              <Link href="/projects/new">
                Creer ma premiere variante
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/[0.12] bg-white/[0.02] px-6 text-[#d8d0c9] hover:bg-white/[0.06] hover:text-white">
              <Link href="/dashboard">
                <Play className="size-4" />
                Voir le pipeline
              </Link>
            </Button>
          </div>
        </div>

        <section className="relative z-10 border-t border-white/[0.07]">
          <div className="flex items-center justify-between py-5 text-[11px] uppercase text-[#746d68]">
            <span>/ Capabilities</span>
            <span>{capabilities.length} modules</span>
          </div>
          <div className="grid border-t border-white/[0.06] md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <article key={capability.title} className="min-h-44 border-b border-white/[0.06] p-5 md:border-r md:border-white/[0.06]">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="grid size-8 place-items-center rounded-md border border-white/[0.08] bg-white/[0.035] text-[#e7b59f]">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[11px] text-[#57514d]">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-[#f4f1ed]">{capability.title}</h2>
                  <p className="mt-3 text-xs leading-6 text-[#8f8781]">{capability.detail}</p>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-[11px] uppercase text-[#8f7066]">/ Walkthrough</p>
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight text-[#f7f3ee] md:text-6xl">
              Upload, brief, render.
              <span className="block text-[#7f7772]">Teste plus vite.</span>
            </h2>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Button asChild variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] text-[#d8d0c9] hover:bg-white/[0.06] hover:text-white">
              <Link href="/projects/new">
                Lancer un test local
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mt-12 rounded-lg border border-white/[0.08] bg-[#111111] p-3 shadow-[0_0_95px_rgba(138,46,28,0.38)]">
          <div className="overflow-hidden rounded-md border border-white/[0.06] bg-[#1a1a1d]">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0d0d0f] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#ef8f7d]" />
                <span className="size-2.5 rounded-full bg-[#d0a553]" />
                <span className="size-2.5 rounded-full bg-[#7db28d]" />
              </div>
              <div className="text-xs text-[#8b8580]">edith/render-worker</div>
            </div>

            <div className="grid min-h-[520px] lg:grid-cols-[220px_1fr_280px]">
              <aside className="hidden border-r border-white/[0.06] bg-[#111114] p-4 lg:block">
                <p className="mb-4 text-[11px] uppercase text-[#6f6863]">Sources</p>
                {['UGC-facecam.mov', 'product-demo.mp4', 'packshot.webm'].map((item, index) => (
                  <div key={item} className="mb-3 rounded-md border border-white/[0.06] bg-white/[0.025] p-3">
                    <div className="mb-2 aspect-video rounded bg-[#252328]" />
                    <p className="text-xs text-[#d8d0c9]">{item}</p>
                    <p className="mt-1 text-[11px] text-[#6f6863]">{index === 0 ? 'selected' : 'ready'}</p>
                  </div>
                ))}
              </aside>

              <div className="relative flex min-h-[520px] items-center justify-center bg-[#17171a] p-5">
                <div className="absolute left-5 top-5 rounded-full border border-white/[0.08] bg-black/35 px-3 py-1 text-xs text-[#d8d0c9]">
                  Ecommerce ad / 9:16
                </div>
                <div className="relative aspect-[9/16] h-[430px] max-h-full overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0c] shadow-2xl">
                  <div className="absolute inset-0 bg-[linear-gradient(160deg,#3b231e_0%,#111_42%,#20251f_100%)]" />
                  <div className="absolute left-5 right-5 top-6 rounded-md bg-[#f1ece6] px-4 py-3 text-center text-sm font-semibold text-[#15100d]">
                    Ce mini produit regle un vrai probleme
                  </div>
                  <div className="absolute inset-x-10 top-32 h-44 rounded-lg border border-white/[0.1] bg-[#d8c3a5]/20" />
                  <div className="absolute inset-x-8 bottom-24 space-y-2">
                    <div className="h-3 rounded-full bg-white/80" />
                    <div className="mx-auto h-3 w-4/5 rounded-full bg-white/50" />
                    <div className="mx-auto h-3 w-2/3 rounded-full bg-white/25" />
                  </div>
                  <div className="absolute bottom-7 left-1/2 grid size-16 -translate-x-1/2 place-items-center rounded-full bg-[#f1ece6] text-[#110d0b]">
                    <Play className="ml-1 size-7 fill-current" />
                  </div>
                </div>
              </div>

              <aside className="border-t border-white/[0.06] bg-[#101012] p-4 lg:border-l lg:border-t-0">
                <p className="mb-4 text-[11px] uppercase text-[#6f6863]">Render queue</p>
                {presets.map(([key, title, detail]) => (
                  <div key={key} className="mb-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[#f4f1ed]">{title}</p>
                      <BadgeCheck className="size-4 text-[#8cc49d]" />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#8f8781]">{detail}</p>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] uppercase text-[#8f7066]">/ Workflow</p>
            <h2 className="mt-4 text-3xl font-semibold text-[#f7f3ee] md:text-5xl">Pas de timeline complexe.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#8f8781]">
              Edith garde Cloudflare leger: app, auth, projets et webhooks. Le rendu lourd part chez Modal.
            </p>
          </div>
          <div className="grid gap-0 border-t border-white/[0.06] md:grid-cols-5">
            {timeline.map((step, index) => (
              <div key={step} className="border-b border-white/[0.06] p-5 md:border-r">
                <p className="text-[11px] text-[#57514d]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-8 text-sm font-semibold text-[#f4f1ed]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/[0.07] px-5 py-8 text-xs text-[#77706b] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03]">
            <Film className="size-4 text-[#e7b59f]" />
          </span>
          <div>
            <p className="font-semibold text-[#f4f1ed]">Edith</p>
            <p>AI ad variants for e-commerce</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link href="/pricing" className="hover:text-[#f4f1ed]">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-[#f4f1ed]">
            Dashboard
          </Link>
          <Link href="/projects/new" className="hover:text-[#f4f1ed]">
            Create
          </Link>
        </div>
      </footer>
    </main>
  );
};

export default Home;
