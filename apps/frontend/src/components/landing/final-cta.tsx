'use client';

import { motion } from 'motion/react';
import { CheckCircle2, Heart } from 'lucide-react';
import { Container } from '@/components/shared/container';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useT } from '@/i18n/locale-context';

export const FinalCta: React.FC = () => {
  const t = useT();
  return (
  <section className="relative overflow-hidden bg-edith-bg py-24 sm:py-32">
    {/* Bottom green glow */}
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[500px]"
      style={{
        background:
          'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(81,224,207,0.10) 0%, transparent 60%)',
      }}
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(81,224,207,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(81,224,207,0.7) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 60% 60% at 50% 100%, black, transparent 70%)',
      }}
      aria-hidden="true"
    />

    <Container className="relative z-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid items-center gap-16 lg:grid-cols-2"
      >
        {/* Left — title + checkmarks */}
        <div className="flex flex-col gap-10">
          <motion.h2
            variants={fadeUp}
            className="text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[64px] lg:leading-[1.05]"
          >
            {t('finalCta.title')}
          </motion.h2>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-edith-accent" strokeWidth={1.5} />
              <span className="text-[15px] text-white/80">{t('finalCta.free')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-edith-accent" strokeWidth={1.5} />
              <span className="text-[15px] text-white/80">{t('finalCta.noCard')}</span>
            </div>
          </motion.div>
        </div>

        {/* Right — heart icon + CTA + rating */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-start gap-8 lg:items-end"
        >
          <div className="relative">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white/8 to-white/2 border border-white/10">
              <Heart className="size-9 text-white fill-white" strokeWidth={1.5} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ShimmerButton
              onClick={() => { window.location.href = '/login'; }}
              background="#51e0cf"
              shimmerColor="rgba(255,255,255,0.95)"
              shimmerDuration="2.6s"
              borderRadius="54px"
              className="px-7 py-3.5 text-[15px]"
              style={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                letterSpacing: '-0.02em',
                boxShadow: '0 0 40px rgba(81,224,207,0.25)',
              }}
            >
              {t('finalCta.cta')}
            </ShimmerButton>
            <div className="flex flex-col">
              <p className="text-[15px] font-semibold text-white">4.80/5</p>
              <p className="text-[13px] text-white/40">{t('finalCta.rating')}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Container>
  </section>
  );
};
