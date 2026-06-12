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

/* ---------- Visuals (one per card) ---------- */

const RadarVisual: React.FC = () => (
  <div className="relative flex h-full min-h-[360px] items-center justify-center">
    <div className="absolute" style={{ width: '320px', height: '320px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.08)' }} />
    <div className="absolute" style={{ width: '220px', height: '220px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)' }} />
    <div className="absolute" style={{ width: '120px', height: '120px', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.12)' }} />
    <div
      className="relative flex items-center justify-center"
      style={{ width: '64px', height: '64px', borderRadius: '99px', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div style={{ width: '28px', height: '28px', borderRadius: '99px', backgroundColor: 'rgba(81,224,207,0.8)' }} />
    </div>
    {/* Labels with avatars */}
    <div className="absolute" style={{ left: '20%', top: '38%' }}>
      <div className="flex items-center" style={{ gap: '8px' }}>
        <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>tsbekkers</span>
        <div style={{ width: '14px', height: '14px', transform: 'rotate(45deg)', backgroundColor: '#e5b364' }} />
      </div>
    </div>
    <div className="absolute" style={{ right: '20%', top: '24%' }}>
      <div className="flex items-center" style={{ gap: '8px' }}>
        <div style={{ width: '14px', height: '14px', transform: 'rotate(-12deg)', backgroundColor: '#a78bfa' }} />
        <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>Hen3</span>
      </div>
    </div>
    <div className="absolute" style={{ right: '24%', bottom: '24%' }}>
      <div className="flex items-center" style={{ gap: '8px' }}>
        <div style={{ width: '14px', height: '14px', transform: 'rotate(90deg)', backgroundColor: '#e05151' }} />
        <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>batukarax</span>
      </div>
    </div>
    {/* Legend */}
    <div className="absolute" style={{ right: '24px', bottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[
        { color: '#a78bfa', value: '12%' },
        { color: '#e05151', value: '84%' },
        { color: '#e5b364', value: '99%' },
      ].map((item) => (
        <div key={item.value} className="flex items-center" style={{ gap: '8px', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '99px', backgroundColor: item.color }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const TimelineVisual: React.FC = () => (
  <div className="flex h-full min-h-[360px] flex-col items-center justify-center" style={{ gap: '12px', padding: '24px' }}>
    {[
      { title: 'Prototyping & Testing', date: 'Mar 01 to Aug 01', color: '#e05151' },
      { title: 'Design & Development', date: 'Jan 01 to June 01', color: '#e5b364' },
      { title: 'Prototyping & Testing', date: 'Mar 01 to Aug 01', color: '#a78bfa' },
    ].map((item, i) => (
      <div
        key={i}
        className="flex items-center w-full max-w-sm"
        style={{
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ width: '3px', height: '36px', borderRadius: '4px', backgroundColor: item.color }} />
        <div className="flex-1">
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.01em' }}>
            {item.title}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{item.date}</p>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>⋮</span>
      </div>
    ))}
  </div>
);

const DashboardVisual: React.FC = () => (
  <div className="flex h-full min-h-[360px] items-center justify-center" style={{ padding: '24px' }}>
    <div
      className="w-full max-w-sm"
      style={{
        padding: '20px',
        borderRadius: '16px',
        backgroundColor: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', marginBottom: '16px' }}>Dashboard</p>
      <div className="flex" style={{ gap: '8px', marginBottom: '16px' }}>
        {[
          { icon: CalendarIcon, label: 'Date', color: '#51e0cf' },
          { icon: Mail, label: 'Mail', color: '#e05151' },
          { icon: Shield, label: 'Console', color: '#a78bfa' },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center"
            style={{
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.04)',
            }}
          >
            <Icon className="size-3.5" style={{ color }} strokeWidth={1.5} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '6px' }}>
            <Upload className="size-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Import CSV</p>
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
            Lorem ipsum dolor sit amet, conse.
          </p>
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <div style={{ height: '6px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <div style={{ height: '6px', borderRadius: '99px', backgroundColor: 'rgba(255,255,255,0.05)', width: '66%' }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------- Cards definition ---------- */

type FeatureCard = {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  visual: React.ReactNode;
  reverse: boolean;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    number: '01',
    icon: Boxes,
    title: 'Exprimez vos idées comme un humain, pas comme une machine.',
    description:
      'Décrivez votre vision en langage naturel. Edith comprend les nuances de votre brief et structure le montage selon votre intention créative.',
    visual: <RadarVisual />,
    reverse: false,
  },
  {
    number: '02',
    icon: Layers,
    title: 'Construisez votre montage bloc par bloc.',
    description:
      'Edith décompose votre vidéo en scènes intelligibles que vous pouvez réorganiser, remplacer ou modifier en un clic.',
    visual: <TimelineVisual />,
    reverse: true,
  },
  {
    number: '03',
    icon: Combine,
    title: 'Pilotez tout depuis un dashboard unifié.',
    description:
      'Suivez vos exports, importez vos sources, surveillez vos performances. Tout votre workflow vidéo dans une interface claire.',
    visual: <DashboardVisual />,
    reverse: false,
  },
];

/* ---------- Section ---------- */

export const FeaturesSection: React.FC = () => (
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
              Edith Product Overview
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
            Découvrez une solution simple de montage vidéo IA.
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
          Edith automatise les étapes répétitives du montage publicitaire pour
          que vous puissiez vous concentrer sur ce qui compte vraiment : tester
          vos angles et scaler ce qui convertit.
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
                    {card.title}
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
                    {card.description}
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
