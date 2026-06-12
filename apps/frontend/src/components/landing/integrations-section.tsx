'use client';

import { motion } from 'motion/react';
import { Container } from '@/components/shared/container';
import { SectionBadge } from '@/components/shared/section-badge';
import { INTEGRATIONS } from '@/lib/constants';
import { fadeUp, staggerContainer } from '@/lib/motion';

const categoryColors: Record<string, string> = {
  'E-commerce': 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  'Ads': 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  'Distribution': 'bg-green-500/15 text-green-300 border-green-500/20',
  'Stockage': 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  'Audio': 'bg-pink-500/15 text-pink-300 border-pink-500/20',
  'Dev': 'bg-edith-accent/15 text-edith-accent border-edith-accent/20',
  'Data': 'bg-orange-500/15 text-orange-300 border-orange-500/20',
};

export const IntegrationsSection: React.FC = () => (
  <section id="integrations" className="bg-edith-bg2 py-24 sm:py-32">
    <Container>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col items-center gap-16"
      >
        <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 text-center">
          <SectionBadge>Intégrations</SectionBadge>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-edith-text sm:text-4xl">
            Connecté à tout votre{' '}
            <span className="text-edith-accent">écosystème</span>
          </h2>
          <p className="max-w-xl text-base text-edith-muted">
            Importez depuis Google Drive, publiez directement sur vos canaux, connectez votre boutique.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="flex w-full flex-wrap justify-center gap-3"
        >
          {INTEGRATIONS.map((integration) => (
            <motion.div
              key={integration.name}
              variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 transition-colors hover:border-white/15 hover:bg-white/5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <div className="size-4 rounded bg-edith-muted/30" />
              </div>
              <span className="text-sm font-medium text-edith-text">{integration.name}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  categoryColors[integration.category] ?? 'bg-white/8 text-edith-muted border-white/10'
                }`}
              >
                {integration.category}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.p variants={fadeUp} className="text-sm text-edith-muted">
          Et bien d'autres à venir via notre{' '}
          <span className="text-edith-accent">API publique</span>
        </motion.p>
      </motion.div>
    </Container>
  </section>
);
