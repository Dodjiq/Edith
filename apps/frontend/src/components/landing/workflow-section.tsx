'use client';

import { motion } from 'motion/react';
import { Container } from '@/components/shared/container';
import { SectionBadge } from '@/components/shared/section-badge';
import { WORKFLOW_STEPS } from '@/lib/constants';
import { fadeUp, staggerContainer } from '@/lib/motion';

export const WorkflowSection: React.FC = () => (
  <section id="workflow" className="border-t border-white/5 bg-edith-bg py-24 sm:py-32">
    <Container>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col items-center gap-16"
      >
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 text-center">
          <SectionBadge>Comment ça marche</SectionBadge>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-edith-text sm:text-4xl">
            De vos rushs à la créa finale{' '}
            <span className="text-edith-accent">en 4 étapes</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid w-full gap-4 sm:grid-cols-2"
        >
          {WORKFLOW_STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-7 transition-colors duration-200 hover:border-white/10 hover:bg-white/3"
            >
              <span className="pointer-events-none absolute -right-2 -top-4 select-none font-mono text-8xl font-bold leading-none text-white/4">
                {step.number}
              </span>
              <div className="relative flex flex-col gap-4">
                <h3 className="text-base font-semibold text-edith-text">{step.title}</h3>
                <p className="text-sm leading-relaxed text-edith-muted">{step.description}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/8 bg-white/3 px-2.5 py-0.5 font-mono text-[10px] text-white/25"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Container>
  </section>
);
