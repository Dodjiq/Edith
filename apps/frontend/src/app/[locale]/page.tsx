import { setRequestLocale } from 'next-intl/server';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clapperboard,
  Film,
  Layers,
  Mic,
  Play,
  Scissors,
  Sparkles,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { Reveal } from '@/components/landing/reveal';
import { Link } from '@/i18n/navigation';
import NextLink from 'next/link';
import { createClient } from '@/utils/supabase/server';

type Props = { params: Promise<{ locale: string }> };

const features = [
  {
    icon: Brain,
    title: 'Creative Analysis',
    description:
      'Understand why ads work. Extract hooks, CTAs, emotions, and storytelling patterns from top-performing creatives.',
  },
  {
    icon: Scissors,
    title: 'Auto Editing',
    description:
      'Automatic editing engine that removes silences, adds b-roll, and structures your video for maximum impact.',
  },
  {
    icon: Layers,
    title: 'Creative Variants',
    description:
      'Generate multiple ad versions from a single asset. Test different hooks, CTAs, and formats simultaneously.',
  },
  {
    icon: Mic,
    title: 'AI Voice',
    description:
      'Generate professional voiceovers instantly. Multiple voices, tones, and languages — no recording required.',
  },
  {
    icon: Users,
    title: 'UGC Generation',
    description:
      'Create realistic UGC-style ads that convert. Authentic-looking content at scale, without hiring creators.',
  },
  {
    icon: BookOpen,
    title: 'Creative Library',
    description:
      'Store and organize all your winning creatives. Build your proprietary creative intelligence over time.',
  },
] as const;

const workflowSteps = [
  {
    step: '01',
    title: 'Upload assets',
    description: 'Drop your raw footage, images, or scripts. We support all major formats up to 50GB.',
  },
  {
    step: '02',
    title: 'AI analysis',
    description: 'Our engine analyzes your content and identifies the strongest creative opportunities.',
  },
  {
    step: '03',
    title: 'Creative generation',
    description: 'Multiple ad variants are generated automatically — ready to test across platforms.',
  },
  {
    step: '04',
    title: 'Launch ads',
    description: 'Export in any format and publish directly to your ad platforms in one click.',
  },
] as const;

const stats = [
  { value: '2,400+', label: 'Creators' },
  { value: '48K+', label: 'Creatives generated' },
  { value: '12K+', label: 'Videos exported' },
  { value: '4.9/5', label: 'Satisfaction' },
] as const;

const plans = [
  {
    name: 'Starter',
    price: '$29',
    description: 'For solo creators and small brands testing ad creative.',
    features: ['10 creatives / month', 'AI auto-editing', 'Creative variants', 'HD export', 'Email support'],
    cta: 'Get started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$79',
    description: 'For growing brands that need to scale their creative output.',
    features: [
      '50 creatives / month',
      'Everything in Starter',
      'UGC generation',
      'AI voice',
      'Creative library',
      'Priority support',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '$199',
    description: 'For agencies managing multiple clients and high creative volume.',
    features: [
      'Unlimited creatives',
      'Everything in Pro',
      'White label',
      'Custom integrations',
      'Dedicated support',
    ],
    cta: 'Contact us',
    highlighted: false,
  },
] as const;

const navLinks = [
  { label: 'Product', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '/contact' },
] as const;

const pipelineSteps = [
  { label: 'Input', icon: Upload, sub: 'Your footage' },
  { label: 'AI Analysis', icon: Brain, sub: 'Content processing' },
  { label: 'Creative Variants', icon: Layers, sub: 'Multiple versions' },
  { label: 'Ready to Launch', icon: Zap, sub: 'Publish instantly' },
] as const;

const Home = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = user !== null;

  return (
    <main
      className="min-h-screen overflow-hidden bg-white text-[#111827]"
      style={{ fontFamily: "var(--font-inter, 'Inter', system-ui, -apple-system, sans-serif)" }}
    >
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-[#111827]">
              <Clapperboard className="size-4 text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#111827]">Edit</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map(({ label, href }) =>
              href.startsWith('#') ? (
                <NextLink
                  key={href}
                  href={href}
                  className="text-sm text-[#6B7280] transition-colors hover:text-[#111827]"
                >
                  {label}
                </NextLink>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-[#6B7280] transition-colors hover:text-[#111827]"
                >
                  {label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                asChild
                size="sm"
                className="rounded-xl bg-[#111827] text-white hover:bg-[#1f2937]"
              >
                <Link href="/dashboard">
                  Dashboard
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden rounded-xl text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] sm:inline-flex"
                >
                  <Link href="/auth/login">Log in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl bg-[#111827] text-white hover:bg-[#1f2937]"
                >
                  <Link href="/auth/register">
                    Start Creating
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-1.5 text-xs font-medium text-[#6B7280]">
            <Sparkles className="size-3.5 text-[#111827]" />
            AI Creative Engine
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.1] tracking-tight text-[#111827] md:text-6xl lg:text-7xl">
            Create winning ads
            <br />
            <span className="text-[#9CA3AF]">in minutes.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-[#6B7280] md:text-lg">
            Upload your videos. Describe what you want.{' '}
            <span className="font-medium text-[#111827]">Edit generates ad creatives automatically.</span>
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-[#111827] px-7 text-[15px] font-medium text-white shadow-sm hover:bg-[#1f2937]"
            >
              <Link href="/auth/register">
                Start Creating
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-[#E5E7EB] px-7 text-[15px] font-medium text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827]"
            >
              <NextLink href="#workflow">
                <Play className="size-4" />
                Watch Demo
              </NextLink>
            </Button>
          </div>
        </Reveal>

        {/* Pipeline visual */}
        <Reveal delay={0.1} className="mt-14">
          <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center sm:gap-3">
            {pipelineSteps.map(({ label, icon: Icon, sub }, i) => (
              <div key={label} className="flex items-center gap-2 sm:gap-3">
                <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-5 shadow-sm sm:flex-none">
                  <div className="grid size-10 place-items-center rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                    <Icon className="size-4.5 text-[#111827]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827]">{label}</p>
                    <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{sub}</p>
                  </div>
                </div>
                {i < 3 && (
                  <ArrowRight className="hidden size-4 shrink-0 text-[#D1D5DB] sm:block" />
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─── Social Proof ─── */}
      <Reveal>
        <div className="border-y border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[#E5E7EB] px-6 md:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-9">
                <span className="text-2xl font-semibold text-[#111827]">{value}</span>
                <span className="text-sm text-[#6B7280]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ─── Features ─── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Features</p>
          <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">
            Everything you need to create ads that convert.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 0.05}>
              <article className="flex h-full flex-col gap-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:border-[#D1D5DB] hover:shadow-md">
                <div className="grid size-10 place-items-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                  <Icon className="size-5 text-[#374151]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#111827]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Workflow ─── */}
      <section id="workflow" className="border-t border-[#E5E7EB] bg-[#F9FAFB] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">How it works</p>
            <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">
              From raw footage to launch-ready creatives in 4 steps.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map(({ step, title, description }, i) => (
              <Reveal key={step} delay={i * 0.07}>
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                  <p className="mb-5 text-4xl font-semibold text-[#F3F4F6]">{step}</p>
                  <h3 className="font-semibold text-[#111827]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">Pricing</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">
            Simple, transparent pricing.
          </h2>
          <p className="mt-3 text-sm text-[#6B7280]">No hidden fees. Cancel anytime.</p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map(({ name, price, description, features, cta, highlighted }, i) => (
            <Reveal key={name} delay={i * 0.07}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-8 shadow-sm ${
                  highlighted ? 'border-[#111827] bg-[#111827]' : 'border-[#E5E7EB] bg-white'
                }`}
              >
                <div className="mb-6">
                  <h3 className={`text-base font-semibold ${highlighted ? 'text-white' : 'text-[#111827]'}`}>
                    {name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-4xl font-semibold ${highlighted ? 'text-white' : 'text-[#111827]'}`}>
                      {price}
                    </span>
                    <span className={`text-sm ${highlighted ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>/mo</span>
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${highlighted ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                    {description}
                  </p>
                </div>

                <ul className="mb-8 flex flex-1 flex-col gap-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2
                        className={`size-4 shrink-0 ${highlighted ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}
                      />
                      <span className={highlighted ? 'text-[#E5E7EB]' : 'text-[#374151]'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full rounded-xl ${
                    highlighted
                      ? 'bg-white text-[#111827] hover:bg-[#F3F4F6]'
                      : 'bg-[#111827] text-white hover:bg-[#1f2937]'
                  }`}
                >
                  <Link href={name === 'Agency' ? '/contact' : '/auth/register'}>
                    {cta}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-[#E5E7EB] bg-[#111827] py-24 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
              Start creating winning ads today.
            </h2>
            <p className="max-w-md text-sm leading-7 text-[#9CA3AF]">
              Join 2,400+ creators and brands generating high-performing ad creatives with AI.
            </p>
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-white px-7 text-[15px] font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Link href="/auth/register">
                Start Creating
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-[#111827]">
              <Film className="size-3.5 text-white" />
            </span>
            <span className="text-sm font-semibold text-[#111827]">Edit</span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-[#6B7280]">
            {[
              { label: 'Contact', href: '/contact' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Legal', href: '/mentions-legales' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="transition-colors hover:text-[#111827]">
                {label}
              </Link>
            ))}
          </div>

          <p className="text-xs text-[#9CA3AF]">© {new Date().getFullYear()} Edit. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
};

export default Home;
