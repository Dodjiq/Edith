'use client';

import { motion } from 'motion/react';
import { Moon, Sparkles, Pencil } from 'lucide-react';
import { Container } from '@/components/shared/container';
import { fadeUp, staggerContainer, VERVE_EASE } from '@/lib/motion';
import { useT } from '@/i18n/locale-context';
import type { TranslationKey } from '@/i18n/translations';

type StatItem = {
  icon: typeof Moon;
  iconColor: string;
  value: string;
  labelKey: TranslationKey;
};

const STATS: StatItem[] = [
  {
    icon: Moon,
    iconColor: 'text-amber-300',
    value: '10×',
    labelKey: 'testimonials.stat1.label',
  },
  {
    icon: Sparkles,
    iconColor: 'text-rose-300',
    value: '95%',
    labelKey: 'testimonials.stat2.label',
  },
  {
    icon: Pencil,
    iconColor: 'text-edith-accent',
    value: '22K+',
    labelKey: 'testimonials.stat3.label',
  },
];

type Testimonial = {
  name: string;
  role: string;
  company: string;
  companyColor: string; // hex from Verve palette
  initials: string;
  quoteKey: TranslationKey;
  time: string;
  date: string;
};

// Colors from Verve palette
const COMPANY_GREEN = '#51e0cf';  // --base--100
const COMPANY_RED = '#e05151';    // --punane--100
const COMPANY_ORANGE = '#e5b364'; // --oranz--100

const TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Leeman', role: 'Marketing Leader', company: '@Mailchimp', companyColor: COMPANY_GREEN, initials: 'SL', quoteKey: 'testimonials.q1', time: '3:45 PM', date: 'Jun 20, 2025' },
  { name: 'Amaya Locosta', role: 'Media Buyer', company: '@Klaviyo', companyColor: COMPANY_RED, initials: 'AL', quoteKey: 'testimonials.q2', time: '11:20 AM', date: 'Jun 18, 2025' },
  { name: 'Justin Case', role: 'Founder', company: '@Shopify', companyColor: COMPANY_ORANGE, initials: 'JC', quoteKey: 'testimonials.q3', time: '9:12 AM', date: 'Jun 15, 2025' },
  { name: 'Sarah Leeman', role: 'Growth Lead', company: '@Mailchimp', companyColor: COMPANY_GREEN, initials: 'SL', quoteKey: 'testimonials.q4', time: '5:48 PM', date: 'Jun 24, 2025' },
  { name: 'Amaya Locosta', role: 'Performance Marketing', company: '@Klaviyo', companyColor: COMPANY_RED, initials: 'AL', quoteKey: 'testimonials.q5', time: '4:30 PM', date: 'Jun 22, 2025' },
  { name: 'Justin Case', role: 'Marketing Leader', company: '@Shopify', companyColor: COMPANY_ORANGE, initials: 'JC', quoteKey: 'testimonials.q6', time: '2:15 PM', date: 'Jun 19, 2025' },
  { name: 'Amaya Locosta', role: 'Creative Director', company: '@Klaviyo', companyColor: COMPANY_RED, initials: 'AL', quoteKey: 'testimonials.q7', time: '10:05 AM', date: 'Jun 21, 2025' },
  { name: 'Justin Case', role: 'E-commerce Manager', company: '@Shopify', companyColor: COMPANY_ORANGE, initials: 'JC', quoteKey: 'testimonials.q8', time: '1:22 PM', date: 'Jun 17, 2025' },
  { name: 'Sarah Leeman', role: 'Brand Lead', company: '@Mailchimp', companyColor: COMPANY_GREEN, initials: 'SL', quoteKey: 'testimonials.q9', time: '8:40 AM', date: 'Jun 23, 2025' },
];

const TestimonialCard: React.FC<{ item: Testimonial }> = ({ item }) => {
  const t = useT();
  return (
  <div
    className="flex flex-col"
    style={{
      gap: '16px',
      backgroundColor: 'rgba(255,255,255,0.012)',
      border: '1px solid rgba(255,255,255,0.078)',
      borderRadius: '16px',
      padding: '24px',
      flexShrink: 0,
    }}
  >
    {/* Author row */}
    <div className="flex items-center" style={{ gap: '12px' }}>
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden"
        style={{ borderRadius: '99px', width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.06)' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
          {item.initials}
        </span>
      </div>
      <div>
        <div
          style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: '-0.09px',
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            color: '#ffffff7a',
            fontSize: '12px',
            lineHeight: 1.7,
            letterSpacing: '0.01px',
          }}
        >
          {item.role} <span style={{ color: item.companyColor }}>{item.company}</span>
        </div>
      </div>
    </div>

    {/* Quote */}
    <p
      style={{
        color: '#ffffffa3',
        fontSize: '14px',
        lineHeight: 1.8,
        letterSpacing: '-0.02em',
        margin: 0,
      }}
    >
      &ldquo;{t(item.quoteKey)}&rdquo;
    </p>

    {/* Date */}
    <div className="flex items-center" style={{ gap: '2px', color: '#ffffff7a' }}>
      <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: '12px', lineHeight: 1.7, letterSpacing: '0.01px' }}>
        {item.time}
      </span>
      <span style={{ width: '18px', fontSize: '12px', textAlign: 'center' }}>·</span>
      <span style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontSize: '12px', lineHeight: 1.7, letterSpacing: '0.01px' }}>
        {item.date}
      </span>
    </div>
  </div>
  );
};

type MarqueeColumnProps = {
  items: Testimonial[];
  direction: 'up' | 'down';
  duration?: number;
};

const MarqueeColumn: React.FC<MarqueeColumnProps> = ({ items, direction, duration = 45 }) => {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];
  const animateY = direction === 'up' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div className="flex h-full overflow-hidden" style={{ flex: 1 }}>
      <motion.div
        className="flex flex-col"
        style={{ gap: '24px', width: '100%' }}
        animate={{ y: animateY }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((item, i) => (
          <TestimonialCard key={i} item={item} />
        ))}
      </motion.div>
    </div>
  );
};

export const TestimonialsSection: React.FC = () => {
  const t = useT();
  // Split 9 testimonials across 3 columns (3 each)
  const col1 = TESTIMONIALS.slice(0, 3);
  const col2 = TESTIMONIALS.slice(3, 6);
  const col3 = TESTIMONIALS.slice(6, 9);

  return (
    <section className="bg-edith-bg py-24 sm:py-32">
      <Container>
        {/* Intro */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col items-center gap-8 text-center"
        >
          <motion.div variants={fadeUp}>
            <span
              className="inline-flex items-center"
              style={{
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04), rgba(255,255,255,0))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                padding: '4px 12px 4px 10px',
                borderRadius: '99px',
                fontSize: '14px',
                lineHeight: 1.8,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08), inset 0 2px 12px rgba(255,255,255,0.04)',
              }}
            >
              <Sparkles className="size-5 text-edith-accent" strokeWidth={1.5} />
              {t('testimonials.badge')}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="max-w-4xl"
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
            {t('testimonials.title')}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            style={{
              maxWidth: '484px',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#ffffffb8',
              letterSpacing: '-0.01em',
            }}
          >
            {t('testimonials.subtitle')}
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            className="mt-8 grid w-full gap-12 md:grid-cols-3"
          >
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.value}
                  variants={fadeUp}
                  className="flex flex-col items-center gap-5"
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '99px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Icon className={`size-6 ${stat.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                      fontSize: '48px',
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                    }}
                  >
                    {stat.value}
                  </span>
                  <p
                    style={{
                      maxWidth: '240px',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#ffffff8f',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {t(stat.labelKey)}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Vertical marquee — 3 columns, alternating directions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: VERVE_EASE }}
          className="relative mt-24"
          style={{ height: '596px', overflow: 'hidden' }}
        >
          <div className="flex h-full" style={{ gap: '24px' }}>
            <MarqueeColumn items={col1} direction="up" duration={50} />
            <MarqueeColumn items={col2} direction="down" duration={55} />
            <MarqueeColumn items={col3} direction="up" duration={45} />
          </div>

          {/* Top fade overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{
              height: '108px',
              backgroundImage: 'linear-gradient(to bottom, #050505, rgba(5,5,5,0))',
            }}
          />
          {/* Bottom fade overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{
              height: '108px',
              backgroundImage: 'linear-gradient(to top, #050505, rgba(5,5,5,0))',
            }}
          />
        </motion.div>
      </Container>
    </section>
  );
};
