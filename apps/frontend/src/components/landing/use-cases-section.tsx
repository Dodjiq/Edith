'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/shared/container';
import { SectionBadge } from '@/components/shared/section-badge';
import { USE_CASES } from '@/lib/constants';
import { fadeUp, staggerContainer } from '@/lib/motion';

export const UseCasesSection: React.FC = () => (
  <section className="bg-edith-bg py-24 sm:py-32">
    <Container>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col items-center gap-16"
      >
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 text-center">
          <SectionBadge>Cas d'usage</SectionBadge>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-edith-text sm:text-4xl">
            Adapté à votre{' '}
            <span className="text-edith-accent">type de business</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid w-full gap-5 sm:grid-cols-2"
        >
          {USE_CASES.map((useCase) => (
            <motion.div
              key={useCase.tag}
              variants={fadeUp}
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-6 transition-colors hover:border-edith-accent/20 hover:bg-edith-accent/5"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: 'radial-gradient(200px circle at top left, rgba(48,244,210,0.06), transparent)',
                }}
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-3">
                <span className="w-fit rounded-full border border-edith-accent/20 bg-edith-accent/10 px-2.5 py-0.5 text-xs font-semibold text-edith-accent">
                  {useCase.tag}
                </span>
                <h3 className="text-lg font-semibold text-edith-text">{useCase.title}</h3>
                <p className="text-sm leading-relaxed text-edith-muted">{useCase.description}</p>
                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-edith-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  En savoir plus
                  <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Container>
  </section>
);
