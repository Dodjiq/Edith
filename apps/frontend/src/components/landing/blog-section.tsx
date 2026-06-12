'use client';

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useT } from '@/i18n/locale-context';
import type { TranslationKey } from '@/i18n/translations';

/* ---------- Isometric SVG illustrations (one per article) ---------- */

const IllustrationCreative: React.FC = () => (
  <svg viewBox="0 0 400 276" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="cube1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
      <linearGradient id="cube1top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    {/* Floating accent shapes */}
    <circle cx="80" cy="60" r="6" fill="#fbbf24" opacity="0.8" />
    <circle cx="320" cy="80" r="4" fill="#a78bfa" />
    <circle cx="60" cy="200" r="5" fill="#34d399" opacity="0.6" />
    <path d="M 100 50 L 110 40 L 120 50 L 110 60 Z" fill="#fbbf24" opacity="0.7" />
    <path d="M 280 50 L 290 40 L 300 50 L 290 60 Z" fill="#a78bfa" opacity="0.7" />

    {/* Isometric cube */}
    <g transform="translate(160, 100)">
      {/* Top face */}
      <polygon points="40,0 80,20 40,40 0,20" fill="url(#cube1top)" />
      {/* Left face */}
      <polygon points="0,20 40,40 40,100 0,80" fill="url(#cube1)" />
      {/* Right face */}
      <polygon points="80,20 40,40 40,100 80,80" fill="#5b21b6" />
      {/* Screen detail */}
      <polygon points="14,30 32,40 32,75 14,65" fill="rgba(0,0,0,0.5)" />
      {/* Pixel art inside */}
      <rect x="18" y="42" width="3" height="3" fill="#fbbf24" />
      <rect x="22" y="44" width="3" height="3" fill="#34d399" />
      <rect x="26" y="42" width="3" height="3" fill="#fbbf24" />
      <rect x="18" y="52" width="3" height="3" fill="#34d399" />
      <rect x="22" y="56" width="3" height="3" fill="#fbbf24" />
      <rect x="26" y="50" width="3" height="3" fill="#34d399" />
    </g>

    {/* Stars */}
    <g transform="translate(220, 80)">
      <path d="M 0 0 L 4 12 L 16 12 L 6 20 L 10 32 L 0 24 L -10 32 L -6 20 L -16 12 L -4 12 Z" fill="#fbbf24" opacity="0.9" />
    </g>
    <g transform="translate(260, 110)">
      <path d="M 0 0 L 3 9 L 12 9 L 4 15 L 8 24 L 0 18 L -8 24 L -4 15 L -12 9 L -3 9 Z" fill="#fbbf24" opacity="0.7" />
    </g>
  </svg>
);

const IllustrationProduct: React.FC = () => (
  <svg viewBox="0 0 400 276" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="cube2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#065f46" />
      </linearGradient>
      <linearGradient id="cube2top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>

    {/* Floating UI bubbles */}
    <g transform="translate(280, 60)">
      <rect width="80" height="40" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" />
      <circle cx="14" cy="20" r="5" fill="#51e0cf" />
      <rect x="24" y="14" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.6)" />
      <rect x="24" y="20" width="32" height="3" rx="1.5" fill="rgba(255,255,255,0.3)" />
    </g>

    {/* Lock icon floating */}
    <g transform="translate(80, 50)">
      <rect width="30" height="26" y="8" rx="4" fill="#374151" stroke="rgba(255,255,255,0.2)" />
      <path d="M 8 8 V 4 Q 8 -2 15 -2 Q 22 -2 22 4 V 8" stroke="rgba(255,255,255,0.5)" fill="none" strokeWidth="2" />
    </g>

    {/* Central stack of files */}
    <g transform="translate(150, 90)">
      {/* Bottom cube */}
      <polygon points="40,40 80,60 40,80 0,60" fill="url(#cube2top)" />
      <polygon points="0,60 40,80 40,130 0,110" fill="url(#cube2)" />
      <polygon points="80,60 40,80 40,130 80,110" fill="#047857" />
      {/* File tabs sticking out top */}
      <rect x="20" y="20" width="40" height="6" rx="1" fill="#fbbf24" />
      <rect x="14" y="14" width="48" height="6" rx="1" fill="#10b981" />
      <rect x="10" y="8" width="56" height="6" rx="1" fill="#6ee7b7" />
    </g>

    {/* Search/magnifier */}
    <g transform="translate(280, 180)">
      <circle r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="10" y1="10" x2="20" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
    </g>

    {/* Small decorative dots */}
    <circle cx="60" cy="160" r="4" fill="#51e0cf" opacity="0.6" />
    <circle cx="340" cy="150" r="3" fill="#fbbf24" opacity="0.5" />
  </svg>
);

const IllustrationGrowth: React.FC = () => (
  <svg viewBox="0 0 400 276" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="cube3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="cube3top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Music notes / sound waves */}
    <g transform="translate(40, 60)">
      <rect x="0" y="20" width="4" height="40" rx="2" fill="#f87171" />
      <rect x="8" y="10" width="4" height="60" rx="2" fill="#f87171" opacity="0.8" />
      <rect x="16" y="25" width="4" height="30" rx="2" fill="#f87171" opacity="0.6" />
      <rect x="24" y="15" width="4" height="50" rx="2" fill="#f87171" opacity="0.9" />
      <rect x="32" y="5" width="4" height="70" rx="2" fill="#f87171" />
      <rect x="40" y="20" width="4" height="40" rx="2" fill="#f87171" opacity="0.8" />
    </g>

    {/* Music note top right */}
    <g transform="translate(280, 50)">
      <circle cx="10" cy="30" r="6" fill="#f87171" />
      <rect x="14" y="6" width="3" height="24" fill="#f87171" />
      <path d="M 14 6 Q 26 6 22 16" stroke="#f87171" strokeWidth="2" fill="none" />
    </g>

    {/* Center radio cube */}
    <g transform="translate(160, 100)">
      <polygon points="40,0 80,20 40,40 0,20" fill="url(#cube3top)" />
      <polygon points="0,20 40,40 40,100 0,80" fill="url(#cube3)" />
      <polygon points="80,20 40,40 40,100 80,80" fill="#78350f" />
      {/* Speaker grill */}
      <circle cx="22" cy="65" r="12" fill="rgba(0,0,0,0.4)" />
      <circle cx="22" cy="65" r="8" fill="rgba(255,255,255,0.1)" />
      {/* Knob */}
      <circle cx="60" cy="50" r="4" fill="rgba(255,255,255,0.4)" />
      {/* Antenna */}
      <line x1="30" y1="5" x2="50" y2="-15" stroke="#f87171" strokeWidth="2" />
      <circle cx="50" cy="-15" r="3" fill="#f87171" />
    </g>

    {/* Vinyl record */}
    <g transform="translate(300, 130)">
      <circle r="32" fill="#1f1917" stroke="rgba(255,255,255,0.15)" />
      <circle r="24" fill="none" stroke="rgba(255,255,255,0.1)" />
      <circle r="16" fill="none" stroke="rgba(255,255,255,0.1)" />
      <circle r="6" fill="#f87171" />
    </g>

    {/* Microphone */}
    <g transform="translate(290, 220)">
      <rect width="14" height="22" rx="7" fill="#f87171" />
      <rect x="4" y="22" width="6" height="10" fill="rgba(255,255,255,0.4)" />
      <rect x="0" y="32" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />
    </g>

    {/* Floating dot */}
    <circle cx="120" cy="60" r="5" fill="#f87171" opacity="0.7" />
    <circle cx="350" cy="80" r="3" fill="#fbbf24" opacity="0.6" />
  </svg>
);

/* ---------- Articles ---------- */

type Article = {
  categoryKey: TranslationKey;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
  illustration: React.ReactNode;
  bgGradient: string;
};

const ARTICLES: Article[] = [
  {
    categoryKey: 'blog.article1.category',
    titleKey: 'blog.article1.title',
    excerptKey: 'blog.article1.excerpt',
    illustration: <IllustrationCreative />,
    bgGradient: 'linear-gradient(135deg, #1e1b4b 0%, #0a0a0a 100%)',
  },
  {
    categoryKey: 'blog.article2.category',
    titleKey: 'blog.article2.title',
    excerptKey: 'blog.article2.excerpt',
    illustration: <IllustrationProduct />,
    bgGradient: 'linear-gradient(135deg, #064e3b 0%, #0a0a0a 100%)',
  },
  {
    categoryKey: 'blog.article3.category',
    titleKey: 'blog.article3.title',
    excerptKey: 'blog.article3.excerpt',
    illustration: <IllustrationGrowth />,
    bgGradient: 'linear-gradient(135deg, #451a03 0%, #0a0a0a 100%)',
  },
];

/* ---------- Section ---------- */

export const BlogSection: React.FC = () => {
  const t = useT();
  return (
  <section id="blog" className="bg-edith-bg" style={{ padding: '120px 5%' }}>
    <div style={{ width: '100%', maxWidth: '1216px', margin: '0 auto' }}>
      {/* top-row: badge + title left, description right (mb 80px) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid items-end gap-8 lg:grid-cols-2 lg:gap-16"
        style={{ marginBottom: '80px' }}
      >
        <div className="flex flex-col" style={{ gap: '32px' }}>
          <motion.div variants={fadeUp}>
            <span
              className="inline-flex items-center"
              style={{
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                backgroundImage:
                  'radial-gradient(circle, rgba(255,255,255,0.04), rgba(255,255,255,0))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '4px 12px 4px 10px',
                borderRadius: '99px',
                fontSize: '14px',
                lineHeight: 1.8,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                boxShadow:
                  'inset 0 1px 1px rgba(255,255,255,0.08), inset 0 2px 12px rgba(255,255,255,0.04)',
              }}
            >
              <Sparkles className="size-5 text-edith-accent" strokeWidth={1.5} />
              {t('blog.badge')}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'transparent',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.56), #ffffff 75%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
            }}
          >
            {t('blog.title')}
          </motion.h2>
        </div>

        <motion.p
          variants={fadeUp}
          style={{
            fontSize: '16px',
            lineHeight: 1.8,
            letterSpacing: '-0.02em',
            color: '#ffffffb8',
            maxWidth: '480px',
          }}
        >
          {t('blog.subtitle')}
        </motion.p>
      </motion.div>

      {/* blog-list: grid 3 cols, gap 32px */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid md:grid-cols-3"
        style={{ gap: '32px' }}
      >
        {ARTICLES.map((article) => (
          <motion.a
            key={article.titleKey}
            href="#"
            variants={fadeUp}
            className="group flex flex-col cursor-pointer"
            style={{ gap: '32px', textDecoration: 'none' }}
          >
            {/* blog-image: 276px height, rounded 16px, bg + border */}
            <div
              className="relative w-full overflow-hidden"
              style={{
                height: '276px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.078)',
                backgroundColor: 'rgba(255,255,255,0.012)',
                backgroundImage: article.bgGradient,
                transition: 'all 0.4s cubic-bezier(0.6, 0.6, 0, 1)',
              }}
            >
              {article.illustration}
            </div>

            {/* wrap-v-regular: text below, gap 12px */}
            <div className="flex flex-col" style={{ gap: '12px', maxWidth: '440px' }}>
              {/* action: category */}
              <div
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  lineHeight: 1.8,
                  letterSpacing: '-0.02em',
                  color: '#ffffff66',
                }}
              >
                {t(article.categoryKey)}
              </div>

              {/* h5: title */}
              <h5
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: '24px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  margin: 0,
                  transition: 'color 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
                }}
              >
                {t(article.titleKey)}
              </h5>

              {/* paragraph-small */}
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: 1.8,
                  letterSpacing: '-0.02em',
                  color: '#ffffff7a',
                  margin: 0,
                }}
              >
                {t(article.excerptKey)}
              </p>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </div>
  </section>
  );
};
