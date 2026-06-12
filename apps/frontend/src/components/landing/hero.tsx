'use client';

import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Container } from '@/components/shared/container';
import { VideoDemo } from '@/components/landing/video-demo';
import { fadeUp, tiltIn, pillarGrow, staggerContainer, VERVE_EASE } from '@/lib/motion';

const HeroPillars: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex h-[900px] w-full max-w-[1440px]"
    style={{ gap: '32px', justifyContent: 'center', zIndex: 0 }}
  >
    {[0, 1, 2, 3].map((n) => (
      <motion.div
        key={n}
        variants={pillarGrow}
        initial="hidden"
        animate="visible"
        transition={{ duration: 1.4, ease: VERVE_EASE, delay: 0.1 + n * 0.08 }}
        className="relative flex h-full justify-between"
        style={{
          flex: 1,
          transformOrigin: 'bottom',
          backgroundImage:
            'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.02) 100%)',
        }}
      >
        <div
          className="h-full"
          style={{
            width: '1px',
            backgroundImage:
              'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 100%)',
          }}
        />
        <div
          className="h-full"
          style={{
            width: '1px',
            backgroundImage:
              'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 100%)',
          }}
        />
      </motion.div>
    ))}
  </div>
);

export const Hero: React.FC = () => (
  <section id="hero" className="relative overflow-hidden bg-edith-bg pt-32">
    {/* 4 vertical column pillars (Verve exact) */}
    <HeroPillars />

    {/* Top radial gradient with fade-in */}
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: VERVE_EASE }}
      className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
      style={{
        zIndex: 2,
        backgroundImage:
          'radial-gradient(circle farthest-corner at 50% -40%, #128b87ad, rgba(5,5,5,0) 68%)',
      }}
    />

    <Container className="relative" style={{ zIndex: 3 }}>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-4 pt-24 text-center"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}>
          <span
            className="inline-flex items-center gap-2 rounded-full text-white"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.04), rgba(255,255,255,0))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              padding: '4px 12px 4px 10px',
              fontSize: '14px',
              lineHeight: '1.8',
              letterSpacing: '-0.02em',
              boxShadow:
                'inset 0 1px 1px rgba(255,255,255,0.08), inset 0 2px 12px rgba(255,255,255,0.04)',
              transition: 'all 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
            }}
          >
            <Sparkles className="size-5 text-edith-accent" strokeWidth={1.5} />
            Edith Product Overview
          </span>
        </motion.div>

        {/* H1 with title-linear gradient effect */}
        <motion.h1
          variants={fadeUp}
          className="max-w-4xl"
          style={{
            fontFamily: 'var(--font-space-grotesk), sans-serif',
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'transparent',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.56), #ffffff 75%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            marginTop: '20px',
          }}
        >
          Produisez des créas publicitaires de qualité en quelques minutes
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-edith-text"
          style={{
            maxWidth: '484px',
            fontSize: '16px',
            lineHeight: 1.6,
            letterSpacing: '-0.01em',
            marginTop: '8px',
          }}
        >
          Importez vos rushs, décrivez le résultat voulu. Edith génère
          plusieurs variantes prêtes à publier sur TikTok, Reels et Meta Ads.
        </motion.p>

        {/* Button-primary */}
        <motion.div variants={fadeUp} style={{ marginTop: '24px' }}>
          <a
            href="/login"
            className="inline-flex items-center"
            style={{
              backgroundColor: '#51e0cf',
              color: '#0a0f0f',
              borderRadius: '54px',
              padding: '12px 24px',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: '24px',
              letterSpacing: '-0.02em',
              gap: '8px',
              transition: 'background-color 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#6deddc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#51e0cf';
            }}
          >
            Commencer gratuitement
          </a>
        </motion.div>

        {/* Video demo with 3D tilt entry */}
        <motion.div
          variants={tiltIn}
          className="w-full"
          style={{
            marginTop: '64px',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            maxWidth: '1100px',
          }}
        >
          <VideoDemo />
        </motion.div>
      </motion.div>
    </Container>
  </section>
);
