import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
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
  Zap,
} from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { Reveal } from '@/components/landing/reveal';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { SignOutButton } from '@/components/SignOutButton';
import { createClient } from '@/utils/supabase/server';

const headingStyle = { fontFamily: 'Georgia, "Times New Roman", serif' };

type Props = { params: Promise<{ locale: string }> };

const Home = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = user !== null;

  const navLinks: Array<{ label: string; href: string; external?: boolean }> = [
    { label: t('nav.product'), href: '#produit', external: true },
    { label: t('nav.workflow'), href: '#workflow', external: true },
    { label: t('nav.pricing'), href: '/pricing' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  const capabilities = [
    { icon: MessageSquareText, key: 'brief' },
    { icon: Upload, key: 'upload' },
    { icon: Captions, key: 'captions' },
    { icon: Scissors, key: 'cuts' },
    { icon: Crop, key: 'formats' },
    { icon: Wand2, key: 'angles' },
    { icon: Gauge, key: 'render' },
    { icon: Download, key: 'exports' },
  ] as const;

  const outcomeKeys = ['test_faster', 'sell_clearer', 'stay_control'] as const;
  const presetKeys = ['ugc_dynamic', 'ecommerce_ad', 'product_demo'] as const;
  const faqKeys = ['capcut', 'vercel_render', 'ugc', 'stripe'] as const;
  const workflowSteps = ['upload', 'preset', 'prompt', 'render', 'exports'] as const;
  const stackKeys = ['supabase', 'vercel', 'modal', 'stripe'] as const;
  const platformKeys = ['tiktok', 'reels', 'facebook'] as const;

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
            {navLinks.map(({ label, href, external }) =>
              external ? (
                <NextLink key={href} href={href} className="transition hover:text-[#f4f1ed]">
                  {label}
                </NextLink>
              ) : (
                <Link key={href} href={href} className="transition hover:text-[#f4f1ed]">
                  {label}
                </Link>
              ),
            )}
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden h-9 rounded-full px-4 text-[#d7d0ca] hover:bg-white/[0.06] hover:text-white sm:inline-flex"
                >
                  <Link href="/dashboard">{t('nav.dashboard')}</Link>
                </Button>
                <SignOutButton variant="ghost" />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="hidden h-9 rounded-full px-4 text-[#d7d0ca] hover:bg-white/[0.06] hover:text-white sm:inline-flex"
                >
                  <Link href="/auth/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild className="h-9 rounded-full bg-[#f1ece6] px-4 text-[#130f0d] hover:bg-white">
                  <Link href="/auth/register">
                    {t('nav.try')}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        <Reveal className="relative z-10 mx-auto flex max-w-5xl flex-col items-center pb-16 pt-24 text-center md:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[11px] text-[#b8aaa2] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="grid size-5 place-items-center rounded-full bg-[#2c1815] text-[#efb3a8]">
              <Wand2 className="size-3" />
            </span>
            {t('hero.badge')}
          </div>

          <h1
            className="max-w-5xl text-5xl font-medium leading-[0.92] text-[#f7f3ee] md:text-7xl lg:text-8xl"
            style={headingStyle}
          >
            {t('hero.title_part1')}
            <span className="text-[#e7a49b]">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-[#9f9690] md:text-lg">
            {t('hero.subtitle')}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[#f1ece6] px-6 text-[#100d0b] shadow-[0_0_42px_rgba(194,76,47,0.22)] hover:bg-white"
            >
              <Link href="/auth/register">
                {t('hero.cta_primary')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/[0.12] bg-white/[0.02] px-6 text-[#d8d0c9] hover:bg-white/[0.06] hover:text-white"
            >
              <NextLink href="#demo">
                <Play className="size-4" />
                {t('hero.cta_secondary')}
              </NextLink>
            </Button>
          </div>

          <div className="mt-10 grid w-full max-w-3xl gap-2 text-left text-xs text-[#9f9690] sm:grid-cols-3">
            {platformKeys.map((key) => (
              <div key={key} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-center">
                {t(`hero.platforms.${key}`)}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="relative z-10 border-t border-white/[0.07]" delay={0.1}>
          <div className="flex items-center justify-between py-5 text-[11px] uppercase text-[#746d68]">
            <span>{t('capabilities.section_label')}</span>
            <span>
              {capabilities.length} {t('capabilities.modules_suffix')}
            </span>
          </div>
          <div className="grid border-t border-white/[0.06] md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, key }, index) => (
              <article
                key={key}
                className="min-h-44 border-b border-white/[0.06] p-5 md:border-r md:border-white/[0.06]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-md border border-white/[0.08] bg-white/[0.035] text-[#e7b59f]">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[11px] text-[#57514d]">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h2 className="text-sm font-semibold text-[#f4f1ed]">{t(`capabilities.items.${key}.title`)}</h2>
                <p className="mt-3 text-xs leading-6 text-[#8f8781]">{t(`capabilities.items.${key}.detail`)}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="produit" className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-[11px] uppercase text-[#8f7066]">{t('outcomes.section_label')}</p>
            <h2 className="mt-4 max-w-xl text-4xl font-medium leading-tight text-[#f7f3ee] md:text-6xl" style={headingStyle}>
              {t('outcomes.title')}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {outcomeKeys.map((key) => (
              <div key={key} className="border-t border-white/[0.08] pt-5">
                <h3 className="text-sm font-semibold text-[#f4f1ed]">{t(`outcomes.items.${key}.title`)}</h3>
                <p className="mt-3 text-sm leading-7 text-[#8f8781]">{t(`outcomes.items.${key}.detail`)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section id="demo" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
        <Reveal className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-[11px] uppercase text-[#8f7066]">{t('demo.section_label')}</p>
            <h2 className="max-w-2xl text-4xl font-medium leading-tight text-[#f7f3ee] md:text-6xl" style={headingStyle}>
              {t('demo.title_part1')}
              <span className="block text-[#7f7772]">{t('demo.title_part2')}</span>
            </h2>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Button asChild variant="outline" className="rounded-full border-white/[0.1] bg-white/[0.02] text-[#d8d0c9] hover:bg-white/[0.06] hover:text-white">
              <Link href="/projects/new">
                {t('demo.cta')}
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
                  {t('demo.preview_label')}
                </div>
                <div className="relative aspect-[9/16] h-[430px] max-h-full overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0c] shadow-2xl">
                  <div className="absolute inset-0 bg-[linear-gradient(160deg,#3b231e_0%,#111_42%,#20251f_100%)]" />
                  <div className="absolute left-5 right-5 top-6 rounded-md bg-[#f1ece6] px-4 py-3 text-center text-sm font-semibold text-[#15100d]">
                    {t('demo.preview_hook')}
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
                {presetKeys.map((key) => (
                  <div key={key} className="mb-3 rounded-md border border-white/[0.07] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[#f4f1ed]">{t(`presets.items.${key}.title`)}</p>
                      <BadgeCheck className="size-4 text-[#8cc49d]" />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#8f8781]">{t(`presets.items.${key}.detail`)}</p>
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
            <p className="text-[11px] uppercase text-[#8f7066]">{t('workflow.section_label')}</p>
            <h2 className="mt-4 text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              {t('workflow.title')}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#8f8781]">{t('workflow.subtitle')}</p>
          </div>
          <div className="grid gap-0 border-t border-white/[0.06] md:grid-cols-5">
            {workflowSteps.map((step, index) => (
              <div key={step} className="border-b border-white/[0.06] p-5 md:border-r">
                <p className="text-[11px] text-[#57514d]">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-8 text-sm font-semibold text-[#f4f1ed]">{t(`workflow.steps.${step}`)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-[11px] uppercase text-[#8f7066]">{t('presets.section_label')}</p>
            <h2 className="mt-4 text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              {t('presets.title')}
            </h2>
          </div>
          <div className="grid gap-4 lg:col-span-2 md:grid-cols-3">
            {presetKeys.map((key) => (
              <article key={key} className="rounded-md border border-white/[0.08] bg-white/[0.025] p-5">
                <Sparkles className="mb-8 size-5 text-[#e7b59f]" />
                <h3 className="text-sm font-semibold text-[#f4f1ed]">{t(`presets.items.${key}.title`)}</h3>
                <p className="mt-3 text-xs leading-6 text-[#8f8781]">{t(`presets.items.${key}.detail`)}</p>
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
              {t('architecture.title')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#8f8781]">{t('architecture.detail')}</p>
          </div>
          <div className="grid gap-3">
            {stackKeys.map((key) => (
              <div key={key} className="flex items-center justify-between border-b border-white/[0.07] py-5">
                <span className="text-sm text-[#d8d0c9]">{t(`architecture.stack.${key}`)}</span>
                <Zap className="size-4 text-[#e7b59f]" />
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/[0.07] px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-[11px] uppercase text-[#8f7066]">{t('faq.section_label')}</p>
            <h2 className="mt-4 text-3xl font-medium text-[#f7f3ee] md:text-5xl" style={headingStyle}>
              {t('faq.title')}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqKeys.map((key) => (
              <article key={key} className="border-t border-white/[0.08] pt-5">
                <h3 className="text-sm font-semibold text-[#f4f1ed]">{t(`faq.items.${key}.q`)}</h3>
                <p className="mt-3 text-sm leading-7 text-[#8f8781]">{t(`faq.items.${key}.a`)}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <Reveal className="rounded-lg border border-white/[0.08] bg-[#f1ece6] p-8 text-[#120e0c] md:p-12">
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-4 text-[11px] uppercase text-[#7a4638]">{t('cta.label')}</p>
              <h2 className="max-w-2xl text-4xl font-medium leading-tight md:text-6xl" style={headingStyle}>
                {t('cta.title')}
              </h2>
            </div>
            <div className="flex flex-col gap-4 lg:items-end">
              <p className="max-w-md text-sm leading-7 text-[#6c5b54]">{t('cta.detail')}</p>
              <Button asChild className="h-12 rounded-full bg-[#120e0c] px-6 text-white hover:bg-[#2a211d]">
                <Link href="/auth/register">
                  {t('cta.button')}
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
              <p>{t('footer.tagline')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/contact" className="hover:text-[#f4f1ed]">
              {t('footer.contact')}
            </Link>
            <Link href="/privacy" className="hover:text-[#f4f1ed]">
              {t('footer.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-[#f4f1ed]">
              {t('footer.terms')}
            </Link>
            <Link href="/mentions-legales" className="hover:text-[#f4f1ed]">
              {t('footer.legal')}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;
