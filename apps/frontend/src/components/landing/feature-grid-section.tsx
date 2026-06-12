'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'motion/react';
import {
  PieChart,
  MonitorPlay,
  Tag,
  Crown,
  MousePointer2,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useT } from '@/i18n/locale-context';
import type { TranslationKey } from '@/i18n/translations';

type Feature = {
  icon: LucideIcon;
  iconColor: string;
  iconRgb: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  detailKey: TranslationKey;
};

const FEATURES: Feature[] = [
  {
    icon: PieChart,
    iconColor: '#51e0cf',
    iconRgb: '81,224,207',
    titleKey: 'grid.multiformat.title',
    descKey: 'grid.multiformat.desc',
    detailKey: 'grid.multiformat.detail',
  },
  {
    icon: MonitorPlay,
    iconColor: '#e05151',
    iconRgb: '224,81,81',
    titleKey: 'grid.hooks.title',
    descKey: 'grid.hooks.desc',
    detailKey: 'grid.hooks.detail',
  },
  {
    icon: Tag,
    iconColor: '#e5b364',
    iconRgb: '229,179,100',
    titleKey: 'grid.library.title',
    descKey: 'grid.library.desc',
    detailKey: 'grid.library.detail',
  },
  {
    icon: Crown,
    iconColor: '#a78bfa',
    iconRgb: '167,139,250',
    titleKey: 'grid.broadcast.title',
    descKey: 'grid.broadcast.desc',
    detailKey: 'grid.broadcast.detail',
  },
  {
    icon: MousePointer2,
    iconColor: '#4ade80',
    iconRgb: '74,222,128',
    titleKey: 'grid.captions.title',
    descKey: 'grid.captions.desc',
    detailKey: 'grid.captions.detail',
  },
  {
    icon: Clock,
    iconColor: '#f472b6',
    iconRgb: '244,114,182',
    titleKey: 'grid.express.title',
    descKey: 'grid.express.desc',
    detailKey: 'grid.express.detail',
  },
];

const FeatureCard: React.FC<{ feature: Feature }> = ({ feature }) => {
  const Icon = feature.icon;
  const t = useT();
  const cardRef = useRef<HTMLDivElement>(null);

  // Track mouse position relative to the card
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-200);
    mouseY.set(-200);
  };

  // Spotlight gradient that follows mouse with icon color
  const spotlight = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(${feature.iconRgb}, 0.10), transparent 70%)`;
  // Sharp accent ring at cursor
  const ring = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, rgba(${feature.iconRgb}, 0.18), transparent 50%)`;

  return (
    <motion.div
      ref={cardRef}
      variants={fadeUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.6, 0.6, 0, 1] }}
      className="group relative flex flex-col justify-between"
      style={{
        gap: '32px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        backgroundColor: 'rgba(255,255,255,0.012)',
        border: '1px solid rgba(255,255,255,0.078)',
        borderRadius: '16px',
        padding: '32px',
        minHeight: '340px',
        transition: 'border-color 0.4s cubic-bezier(0.6, 0.6, 0, 1), box-shadow 0.4s cubic-bezier(0.6, 0.6, 0, 1)',
        // @ts-expect-error CSS variable
        '--icon-rgb': feature.iconRgb,
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(${feature.iconRgb}, 0.3)`;
        e.currentTarget.style.boxShadow = `0 20px 60px -20px rgba(${feature.iconRgb}, 0.25), inset 0 0 0 1px rgba(${feature.iconRgb}, 0.06)`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.078)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Mouse-follow spotlight — outer soft glow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight, borderRadius: '16px' }}
      />

      {/* Mouse-follow ring — sharper inner accent */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: ring, borderRadius: '16px', mixBlendMode: 'screen' }}
      />

      {/* Top gradient sheen — appears on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(180deg, rgba(${feature.iconRgb}, 0.08) 0%, transparent 100%)`,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      />

      {/* Icon with scale + glow on hover */}
      <div
        className="relative flex items-center transition-transform duration-300 group-hover:scale-110"
        style={{
          width: '32px',
          height: '32px',
          transformOrigin: 'left center',
          filter: 'drop-shadow(0 0 0 transparent)',
        }}
      >
        {/* Mint/icon glow behind */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
          style={{ backgroundColor: feature.iconColor, borderRadius: '99px' }}
        />
        <Icon
          className="size-8 relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_currentColor]"
          style={{ color: feature.iconColor }}
          strokeWidth={1.5}
        />
      </div>

      {/* Title + paragraphs */}
      <div
        className="relative flex flex-col transition-transform duration-300 group-hover:translate-y-[-2px]"
        style={{ gap: '24px', marginTop: 'auto' }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: '22px',
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            transition: 'color 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
          }}
        >
          {t(feature.titleKey)}
        </h3>
        <p
          className="transition-colors duration-300 group-hover:text-white/85"
          style={{
            fontSize: '14px',
            lineHeight: 1.8,
            letterSpacing: '-0.02em',
            color: '#ffffffb8',
          }}
        >
          {t(feature.descKey)}
        </p>
        <p
          className="transition-colors duration-300 group-hover:text-white/60"
          style={{
            fontSize: '14px',
            lineHeight: 1.8,
            letterSpacing: '-0.02em',
            color: '#ffffff7a',
          }}
        >
          {t(feature.detailKey)}
        </p>
      </div>
    </motion.div>
  );
};

export const FeatureGridSection: React.FC = () => (
  <section className="bg-edith-bg" style={{ padding: '0 5% 120px' }}>
    <div style={{ width: '100%', maxWidth: '1216px', margin: '0 auto' }}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid sm:grid-cols-2 lg:grid-cols-3"
        style={{ gap: '32px' }}
      >
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.titleKey} feature={feature} />
        ))}
      </motion.div>
    </div>
  </section>
);
