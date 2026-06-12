'use client';

import { motion } from 'motion/react';
import {
  Sparkles,
  Boxes,
  Combine,
  Layers,
  Calendar as CalendarIcon,
  Mail,
  Shield,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { fadeUp, staggerContainer, VERVE_EASE } from '@/lib/motion';
import { useT } from '@/i18n/locale-context';
import type { TranslationKey } from '@/i18n/translations';

/* ---------- Visuals (one per card) ---------- */

const RadarVisual: React.FC = () => (
  <div className="relative flex h-full min-h-[360px] items-center justify-center overflow-hidden">
    {/* Concentric circles — radar ping outward */}
    {[
      { size: 320, delay: 0 },
      { size: 220, delay: 0.9 },
      { size: 120, delay: 1.8 },
    ].map(({ size, delay }, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '99px',
          border: `1px solid rgba(255,255,255,${0.08 + i * 0.02})`,
        }}
        animate={{ scale: [1, 1.04, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2.7, ease: 'easeInOut', repeat: Infinity, delay }}
      />
    ))}

    {/* Radar sweep — rotating conic gradient */}
    <motion.div
      aria-hidden="true"
      className="absolute pointer-events-none"
      style={{
        width: '320px',
        height: '320px',
        borderRadius: '99px',
        background:
          'conic-gradient(from 0deg, transparent 0deg, transparent 320deg, rgba(81,224,207,0.18) 350deg, rgba(81,224,207,0.35) 360deg)',
        maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
    />

    {/* Center dot — pulsing mint */}
    <div
      className="relative flex items-center justify-center z-10"
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '99px',
        backgroundColor: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <motion.div
        style={{ width: '28px', height: '28px', borderRadius: '99px', backgroundColor: 'rgba(81,224,207,0.8)' }}
        animate={{ scale: [1, 1.12, 1], boxShadow: ['0 0 0 rgba(81,224,207,0)', '0 0 24px rgba(81,224,207,0.6)', '0 0 0 rgba(81,224,207,0)'] }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>

    {/* Avatar markers with float */}
    {[
      { side: 'left', pos: { left: '20%', top: '38%' }, name: 'tsbekkers', color: '#e5b364', shape: 'rotate(45deg)', delay: 0, dir: 'left' as const },
      { side: 'right', pos: { right: '20%', top: '24%' }, name: 'Hen3', color: '#a78bfa', shape: 'rotate(-12deg)', delay: 0.6, dir: 'right' as const },
      { side: 'right', pos: { right: '24%', bottom: '24%' }, name: 'batukarax', color: '#e05151', shape: 'rotate(90deg)', delay: 1.2, dir: 'right' as const },
    ].map((m) => (
      <motion.div
        key={m.name}
        className="absolute"
        style={m.pos}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.4, ease: 'easeInOut', repeat: Infinity, delay: m.delay }}
      >
        <div className="flex items-center" style={{ gap: '8px' }}>
          {m.dir === 'left' && (
            <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
              {m.name}
            </span>
          )}
          <motion.div
            style={{ width: '14px', height: '14px', transform: m.shape, backgroundColor: m.color }}
            animate={{ boxShadow: ['0 0 0 rgba(0,0,0,0)', `0 0 12px ${m.color}aa`, '0 0 0 rgba(0,0,0,0)'] }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, delay: m.delay }}
          />
          {m.dir === 'right' && (
            <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>
              {m.name}
            </span>
          )}
        </div>
      </motion.div>
    ))}

    {/* Legend — pulsing dots */}
    <div className="absolute" style={{ right: '24px', bottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[
        { color: '#a78bfa', value: '12%', delay: 0 },
        { color: '#e05151', value: '84%', delay: 0.4 },
        { color: '#e5b364', value: '99%', delay: 0.8 },
      ].map((item) => (
        <div key={item.value} className="flex items-center" style={{ gap: '8px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            style={{ width: '8px', height: '8px', borderRadius: '99px', backgroundColor: item.color }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, delay: item.delay }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const TIMELINE_ITEMS = [
  { title: 'Prototyping & Testing', date: 'Mar 01 to Aug 01', color: '#e05151' },
  { title: 'Design & Development', date: 'Jan 01 to June 01', color: '#e5b364' },
  { title: 'Prototyping & Testing', date: 'Mar 01 to Aug 01', color: '#a78bfa' },
];

const TimelineVisual: React.FC = () => (
  <div className="relative flex h-full min-h-[360px] flex-col items-center justify-center" style={{ gap: '12px', padding: '24px' }}>
    {/* Floating dot top-right */}
    <motion.div
      className="absolute"
      style={{
        right: '12%',
        top: '14%',
        width: '12px',
        height: '12px',
        borderRadius: '99px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
      animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '1px solid rgba(81,224,207,0.5)' }}
        animate={{ scale: [1, 2.4, 2.4], opacity: [0.6, 0, 0] }}
        transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity }}
      />
    </motion.div>

    {TIMELINE_ITEMS.map((item, i) => (
      <motion.div
        key={i}
        className="flex items-center w-full max-w-sm relative"
        style={{
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
        animate={{
          y: [0, -2, 0],
          borderColor: [
            'rgba(255,255,255,0.06)',
            `${item.color}55`,
            'rgba(255,255,255,0.06)',
          ],
          backgroundColor: [
            'rgba(255,255,255,0.025)',
            `${item.color}14`,
            'rgba(255,255,255,0.025)',
          ],
          boxShadow: [
            '0 0 0 rgba(0,0,0,0)',
            `0 0 24px ${item.color}26`,
            '0 0 0 rgba(0,0,0,0)',
          ],
        }}
        transition={{
          duration: 1.6,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 3.2,
          delay: i * 1.6,
        }}
      >
        {/* Color bar with glow */}
        <motion.div
          style={{ width: '3px', height: '36px', borderRadius: '4px', backgroundColor: item.color }}
          animate={{ boxShadow: ['0 0 0 rgba(0,0,0,0)', `0 0 12px ${item.color}cc`, '0 0 0 rgba(0,0,0,0)'] }}
          transition={{
            duration: 1.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 3.2,
            delay: i * 1.6,
          }}
        />

        <div className="flex-1">
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.01em' }}>
            {item.title}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.date}</p>
        </div>

        {/* Menu dots */}
        <motion.span
          style={{ color: 'rgba(255,255,255,0.4)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{
            duration: 1.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 3.2,
            delay: i * 1.6,
          }}
        >
          ⋮
        </motion.span>

        {/* Active sweep — light bar crossing the active row */}
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '40%',
            background: `linear-gradient(90deg, transparent, ${item.color}1f, transparent)`,
            pointerEvents: 'none',
          }}
          animate={{ x: ['-100%', '250%'] }}
          transition={{
            duration: 1.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 3.2,
            delay: i * 1.6,
          }}
        />
      </motion.div>
    ))}
  </div>
);

const CHIPS = [
  { icon: CalendarIcon, label: 'Date', color: '#51e0cf' },
  { icon: Mail, label: 'Mail', color: '#e05151' },
  { icon: Shield, label: 'Console', color: '#a78bfa' },
];

const DashboardVisual: React.FC = () => (
  <div className="flex h-full min-h-[360px] items-center justify-center" style={{ padding: '24px' }}>
    {/* Floating dot avatar — pulsing outside top-left */}
    <motion.div
      className="absolute"
      style={{
        left: '8%',
        top: '22%',
        width: '12px',
        height: '12px',
        borderRadius: '99px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.25)',
      }}
      animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: '1px solid rgba(81,224,207,0.5)' }}
        animate={{ scale: [1, 2.4, 2.4], opacity: [0.6, 0, 0] }}
        transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity }}
      />
    </motion.div>

    {/* Main card — subtle floating */}
    <motion.div
      className="relative w-full max-w-sm"
      style={{
        padding: '20px',
        borderRadius: '16px',
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
    >
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>Dashboard</p>

      {/* Chips — staggered active glow cycling between them */}
      <div className="flex" style={{ gap: '8px', marginBottom: '16px' }}>
        {CHIPS.map(({ icon: Icon, label, color }, i) => (
          <motion.div
            key={label}
            className="flex items-center"
            style={{
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
            animate={{
              borderColor: ['rgba(255,255,255,0.1)', `${color}80`, 'rgba(255,255,255,0.1)'],
              backgroundColor: [
                'rgba(255,255,255,0.04)',
                `${color}1a`,
                'rgba(255,255,255,0.04)',
              ],
              boxShadow: [
                '0 0 0 rgba(0,0,0,0)',
                `0 0 16px ${color}40`,
                '0 0 0 rgba(0,0,0,0)',
              ],
            }}
            transition={{
              duration: 1.4,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 2.8,
              delay: i * 1.4,
            }}
          >
            <Icon className="size-3.5" style={{ color }} strokeWidth={1.5} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{label}</span>
          </motion.div>
        ))}
      </div>

      {/* Import CSV panel */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
        <motion.div
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
          animate={{
            borderColor: [
              'rgba(255,255,255,0.08)',
              'rgba(81,224,207,0.25)',
              'rgba(255,255,255,0.08)',
            ],
          }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
        >
          {/* Header with bouncing upload icon */}
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '6px' }}>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
            >
              <Upload className="size-4" style={{ color: '#51e0cf' }} strokeWidth={1.8} />
            </motion.div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Import CSV</p>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
            Lorem ipsum dolor sit amet, conse.
          </p>

          {/* Animated loading bars */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            {/* Bar 1 — fills 0 -> 100% on loop */}
            <div
              style={{
                height: '6px',
                borderRadius: '99px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '99px',
                  background:
                    'linear-gradient(90deg, #51e0cf 0%, #6deddc 50%, #51e0cf 100%)',
                  transformOrigin: 'left center',
                }}
                animate={{ scaleX: [0, 1, 1] }}
                transition={{
                  duration: 3,
                  times: [0, 0.7, 1],
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
              />
            </div>
            {/* Bar 2 — fills 0 -> 66% with delay */}
            <div
              style={{
                height: '6px',
                borderRadius: '99px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                overflow: 'hidden',
                position: 'relative',
                width: '66%',
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '99px',
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 100%)',
                  transformOrigin: 'left center',
                }}
                animate={{ scaleX: [0, 1, 1] }}
                transition={{
                  duration: 3,
                  times: [0, 0.7, 1],
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: 0.3,
                }}
              />
            </div>
          </div>

          {/* Mint glow sweep on panel */}
          <motion.div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: '40%',
              background:
                'linear-gradient(90deg, transparent, rgba(81,224,207,0.08), transparent)',
              pointerEvents: 'none',
            }}
            animate={{ x: ['-100%', '250%'] }}
            transition={{
              duration: 3,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  </div>
);

/* ---------- Cards definition ---------- */

type FeatureCard = {
  number: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  visual: React.ReactNode;
  reverse: boolean;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    number: '01',
    icon: Boxes,
    titleKey: 'features.card1.title',
    descKey: 'features.card1.desc',
    visual: <RadarVisual />,
    reverse: false,
  },
  {
    number: '02',
    icon: Layers,
    titleKey: 'features.card2.title',
    descKey: 'features.card2.desc',
    visual: <TimelineVisual />,
    reverse: true,
  },
  {
    number: '03',
    icon: Combine,
    titleKey: 'features.card3.title',
    descKey: 'features.card3.desc',
    visual: <DashboardVisual />,
    reverse: false,
  },
];

/* ---------- Section ---------- */

export const FeaturesSection: React.FC = () => {
  const t = useT();
  return (
  <section id="features" className="bg-edith-bg" style={{ padding: '120px 5%' }}>
    <div style={{ width: '100%', maxWidth: '1216px', margin: '0 auto' }}>
      {/* top-row: title left + description right, mb 80px */}
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
              {t('hero.badge')}
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
            {t('features.title')}
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
          {t('features.subtitle')}
        </motion.p>
      </motion.div>

      {/* Bento cards — gap 32px between cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col"
        style={{ gap: '32px' }}
      >
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.number}
              variants={fadeUp}
              style={{
                backgroundColor: '#050505',
                border: '1.2px solid rgba(255,255,255,0.06)',
                borderRadius: '24px',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '12px',
                transition: 'all 0.5s cubic-bezier(0.6, 0.6, 0, 1)',
              }}
              className="lg:!grid-cols-2"
            >
              {/* benefits-content — padding 44px */}
              <div
                className="flex flex-col justify-between"
                style={{
                  padding: '44px',
                  minHeight: '440px',
                  borderRadius: '16px',
                  order: card.reverse ? 2 : 1,
                  gap: '32px',
                }}
              >
                {/* Top row: icon + number-badge */}
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center justify-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <Icon className="size-8 text-edith-accent" strokeWidth={1.5} />
                  </div>

                  <div
                    className="flex items-center justify-center"
                    style={{
                      padding: '16px 28px',
                      borderRadius: '99px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(140px)',
                      WebkitBackdropFilter: 'blur(140px)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)',
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {card.number}
                  </div>
                </div>

                {/* Bottom: title + description */}
                <div className="flex flex-col" style={{ gap: '16px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                      fontSize: 'clamp(28px, 3vw, 40px)',
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                      maxWidth: '460px',
                    }}
                  >
                    {t(card.titleKey)}
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.8,
                      letterSpacing: '-0.02em',
                      color: '#ffffffb8',
                      maxWidth: '460px',
                    }}
                  >
                    {t(card.descKey)}
                  </p>
                </div>
              </div>

              {/* benefits-image — inner card with border + radius 16px */}
              <div
                className="relative overflow-hidden"
                style={{
                  border: '1px solid rgba(255,255,255,0.078)',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.012)',
                  minHeight: '440px',
                  order: card.reverse ? 1 : 2,
                }}
              >
                {card.visual}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  </section>
  );
};
