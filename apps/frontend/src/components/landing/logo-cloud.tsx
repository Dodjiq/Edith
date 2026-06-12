'use client';

import { motion } from 'motion/react';
import { Container } from '@/components/shared/container';
import { fadeUp, staggerContainer } from '@/lib/motion';

const ROW_1 = [
  { name: 'upgrade', weight: 600 },
  { name: 'checkr', weight: 600 },
  { name: 'LMCU', weight: 700 },
  { name: 'move', weight: 600, italic: true },
  { name: 'shopify', weight: 700 },
  { name: 'klaviyo', weight: 600 },
  { name: 'gorgias', weight: 600 },
];

const ROW_2 = [
  { name: 'recharge', weight: 600 },
  { name: 'mailchimp', weight: 600 },
  { name: 'attentive', weight: 700 },
  { name: 'postscript', weight: 600 },
  { name: 'okendo', weight: 600 },
  { name: 'judge.me', weight: 600 },
  { name: 'loop', weight: 700 },
];

type MarqueeRowProps = {
  items: typeof ROW_1;
  direction: 'left' | 'right';
  duration?: number;
};

const MarqueeRow: React.FC<MarqueeRowProps> = ({ items, direction, duration = 40 }) => {
  const doubled = [...items, ...items];
  const animateX = direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'];

  return (
    <div className="relative w-full overflow-hidden">
      <motion.div
        className="flex"
        style={{ gap: '64px', width: 'max-content' }}
        animate={{ x: animateX }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((logo, i) => (
          <div
            key={i}
            className="flex shrink-0 items-center justify-center"
            style={{
              minWidth: '160px',
              fontSize: '28px',
              fontWeight: logo.weight,
              fontStyle: logo.italic ? 'italic' : 'normal',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '-0.02em',
              transition: 'color 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          >
            {logo.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export const LogoCloud: React.FC = () => (
  <section className="relative bg-edith-bg pt-24 pb-16 sm:pt-32 sm:pb-24">
    <Container>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col items-center gap-12 text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="max-w-3xl"
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 'clamp(22px, 2.5vw, 28px)',
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}
        >
          Les meilleures équipes e-commerce font confiance à Edith.
        </motion.h2>
      </motion.div>
    </Container>

    {/* 2 horizontal marquee rows — opposite directions */}
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.6, 0.6, 0, 1] }}
      className="relative mt-12 flex flex-col gap-8"
    >
      <MarqueeRow items={ROW_1} direction="left" duration={50} />
      <MarqueeRow items={ROW_2} direction="right" duration={55} />

      {/* Side fade overlays */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          width: '160px',
          backgroundImage: 'linear-gradient(to right, #050505, rgba(5,5,5,0))',
          zIndex: 2,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{
          width: '160px',
          backgroundImage: 'linear-gradient(to left, #050505, rgba(5,5,5,0))',
          zIndex: 2,
        }}
      />
    </motion.div>

    <Container>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.6, 0.6, 0, 1], delay: 0.3 }}
        className="mt-12 text-center"
        style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '-0.01em',
        }}
      >
        Utilisé par des e-commerçants partout dans le monde.
      </motion.p>
    </Container>
  </section>
);
