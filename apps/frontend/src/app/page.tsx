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
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
  Workflow,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { Reveal } from '@/components/landing/reveal';

const headingStyle = { fontFamily: 'Georgia, "Times New Roman", serif' };

const navLinks = [
  ['Produit', '#produit'],
  ['Workflow', '#workflow'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
];

const capabilities = [
  {
    icon: MessageSquareText,
    title: 'Brief naturel',
    detail: 'Explique le produit, le ton, la cible ou le style. Edith transforme le brief en plan de montage exploitable.',
  },
  {
    icon: Upload,
    title: 'Upload direct',
    detail: 'Tes rushs vont dans Supabase Storage. Cloudflare reste leger et ne touche jamais au rendu lourd.',
  },
  {
    icon: Captions,
    title: 'Captions ads',
    detail: 'Sous-titres courts, lisibles et places pour retenir l attention sur mobile.',
  },
  {
    icon: Scissors,
    title: 'Cuts et rythme',
    detail: 'Structure rapide, silences limites, hooks plus nets et transitions simples.',
  },
  {
    icon: Crop,
    title: 'Formats sociaux',
    detail: '9:16, 1:1 ou 16:9 pour TikTok Ads, Reels Ads, Shorts et Facebook Ads.',
  },
  {
    icon: Wand2,
    title: 'Angles marketing',
    detail: 'Probleme-solution, benefice, preuve, demo produit ou objection client.',
  },
  {
    icon: Gauge,
    title: 'Rendu Modal',
    detail: 'FFmpeg et faster-whisper tournent dans Modal, pas dans le navigateur ni dans Cloudflare.',
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

const outcomes = [
  ['Pour tester plus vite', 'Transforme un seul rush en plusieurs hypotheses creatives sans ouvrir une timeline.'],
  ['Pour vendre plus clairement', 'Chaque variante met en avant un angle: benefice, preuve, objection ou demo.'],
  ['Pour garder le controle', 'Tu gardes le preset, le format, la langue, le nombre de variantes et le brief.'],
];

const faq = [
  ['Edith remplace CapCut ?', 'Non. Edith ne cherche pas a devenir un editeur manuel complet. Le MVP vise la generation de variantes publicitaires pretes a tester.'],
  ['Est-ce que Cloudflare rend les videos ?', 'Non. Cloudflare sert l app et les API legeres. Les taches lourdes FFmpeg/transcription partent chez Modal.'],
  ['Puis-je utiliser mes propres videos UGC ?', 'Oui. L upload est prevu pour rushs produit, UGC, demo, temoignage, packshot ou video COD/dropshipping.'],
  ['Stripe est-il obligatoire ?', 'Non pour tester. Le mode billing peut rester desactive, puis les credits et abonnements seront branches progressivement.'],
];

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
            {navLinks.map(([label, href]) => (
              <Link key={href} href={href} className="transition hover:text-[#f4f1ed]">
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden h-9 rounded-full px-4 text-[#d7d0ca] hover:bg-white/[0.06] hover:text-white sm:inline-flex">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild className="h-9 rounded-full bg-[#f1ece6] px-4 text-[#130f0d] hover:bg-white">
              <Link href="/auth/register">
                Essayer
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </nav>

        <Reveal className="relative z-10 mx-auto flex max-w-5xl flex-col items-center pb-16 pt-24 text-center md:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[11px] text-[#b8aaa2] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="grid size-5 place-items-center rounded-full bg-[#2c1815] text-[#efb3a8]">
              <Wand2 className="size-3" />
            </span>
            AI ad variant engine for e-commerce
          </div>

          <h1 className="max-w-5xl text-5xl font-medium leading-[0.92] text-[#f7f3ee] md:text-7xl lg:text-8xl" style={headingStyle}>
            Tes rushs produit deviennent des ads pretes a tester.
            <span className="text-[#e7a49b]">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-[#9f9690] md:text-lg">
            Edith aide les marques e-commerce et dropshipping a transformer une video brute en plusieurs variantes
            courtes avec hooks, sous-titres, cuts, zooms et angles marketing.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-[#f1ece6] px-6 text-[#100d0b] shadow-[0_0_42px_rgba(194,76,47,0.22)] hover:bg-white">
              <Link href="/auth/register">
                Creer ma premiere variante
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/[0.12] bg-white/[0.02] px-6 text-[#d8d0c9] hover:bg-white/[0.06] hover:text-white">
              <Link href="#demo">
                <Play className="size-4" />
                Voir le pipeline
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid w-full max-w-3xl gap-2 text-left text-xs text-[#9f9690] sm:grid-cols-3">
            {['TikTok Ads', 'Reels Ads', 'Facebook Ads'].map((item) => (
              <div key={item} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-center">
                {item}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="relative z-10 border-t border-white/[0.07]" delay={0.1}>
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
        </Reveal>
      </section>

      <section id="produit" className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] uppercase text-[#8f7066]">/ Pourquoi Edith</p>
            <h2 className="mt-4 max-w-xl text-4xl font-medium leading-tight text-[#f7f3ee] md:text-6xl" style={headingStyle}>
              Une machine a tests creatifs, pas un editeur video generaliste.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {outcomes.map(([title, detail]) => (
              <div key={title} className="border-t border-white/[0.08] pt-5">
                <h3 className="text-sm font-semibold text-[#f4f1ed]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#8f8781]">{detail}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="demo" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <Reveal className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-[11px] uppercase text-[#8f7066]">/ Walkthrough</p>
            <h2 className="max-w-2xl text-4xl font-medium leading-tight text-[#f7f3ee] md:text-6xl" style={headingStyle}>
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
        </Reveal>

        <Reveal className="relative mt-12 rounded-lg border border-white/[0.08] bg-[#111111] p-3 shadow-[0_0_95px_rgba(138,46,28,0.38)]" delay={0.1}>
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
        </Reveal>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[11px] uppercase text-[#8f7066]">/ Workflow</p>
            <h2 className="mt-4 text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              Pas de timeline complexe.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#8f8781]">
              Edith garde Cloudflare leger: app, auth, projets et webhooks. Le rendu lourd part chez Modal.
            </p>
          </div>
          <div className="grid gap-0 border-t border-white/[0.06] md:grid-cols-5">
            {['Upload', 'Preset', 'Prompt', 'Render', 'Exports'].map((step, index) => (
              <div key={step} className="border-b border-white/[0.06] p-5 md:border-r">
                <p className="text-[11px] text-[#57514d]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-8 text-sm font-semibold text-[#f4f1ed]">{step}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-[11px] uppercase text-[#8f7066]">/ Presets MVP</p>
            <h2 className="mt-4 text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              Trois modes, assez pour lancer les premiers tests.
            </h2>
          </div>
          <div className="grid gap-4 lg:col-span-2 md:grid-cols-3">
            {presets.map(([key, title, detail]) => (
              <article key={key} className="rounded-md border border-white/[0.08] bg-white/[0.025] p-5">
                <Sparkles className="mb-8 size-5 text-[#e7b59f]" />
                <h3 className="text-sm font-semibold text-[#f4f1ed]">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-[#8f8781]">{detail}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-white/[0.08] bg-[#0d0b0a] p-8">
            <ShieldCheck className="mb-8 size-6 text-[#e7b59f]" />
            <h2 className="text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              Une architecture pensee pour grandir.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#8f8781]">
              Supabase gere auth, stockage et donnees. Modal gere les rendus video. Stripe peut etre branche
              sans bloquer le MVP. Le service role reste cote serveur uniquement.
            </p>
          </div>
          <div className="grid gap-3">
            {['Supabase Auth + Storage', 'Cloudflare Pages/OpenNext', 'Modal FFmpeg worker', 'Stripe credits ready'].map((item) => (
              <div key={item} className="flex items-center justify-between border-b border-white/[0.07] py-5">
                <span className="text-sm text-[#d8d0c9]">{item}</span>
                <Zap className="size-4 text-[#e7b59f]" />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-[11px] uppercase text-[#8f7066]">/ FAQ</p>
            <h2 className="mt-4 text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              Les bonnes questions avant de lancer.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faq.map(([question, answer]) => (
              <article key={question} className="border-t border-white/[0.08] pt-5">
                <h3 className="text-sm font-semibold text-[#f4f1ed]">{question}</h3>
                <p className="mt-3 text-sm leading-7 text-[#8f8781]">{answer}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="rounded-lg border border-white/[0.08] bg-[#f1ece6] p-8 text-[#120e0c] md:p-12">
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-4 text-[11px] uppercase text-[#7a4638]">/ Premiere campagne</p>
              <h2 className="max-w-2xl text-4xl font-medium leading-tight md:text-6xl" style={headingStyle}>
                Transforme ton prochain rush produit en variantes testables.
              </h2>
            </div>
            <div className="flex flex-col gap-4 lg:items-end">
              <p className="max-w-md text-sm leading-7 text-[#6c5b54]">
                Commence en mode mock, branche Modal ensuite, puis ajoute Stripe quand les premiers rendus sont prets.
              </p>
              <Button asChild className="h-12 rounded-full bg-[#120e0c] px-6 text-white hover:bg-[#2a211d]">
                <Link href="/auth/register">
                  Creer un compte
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/[0.07] px-5 py-8 text-xs text-[#77706b] sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
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
            <Link href="/contact" className="hover:text-[#f4f1ed]">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-[#f4f1ed]">
              Politique de confidentialite
            </Link>
            <Link href="/terms" className="hover:text-[#f4f1ed]">
              Conditions
            </Link>
            <Link href="/mentions-legales" className="hover:text-[#f4f1ed]">
              Mentions legales
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
