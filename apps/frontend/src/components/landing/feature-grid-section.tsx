'use client';

import { motion } from 'motion/react';
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

type Feature = {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  detail: string;
};

const FEATURES: Feature[] = [
  {
    icon: PieChart,
    iconColor: '#51e0cf',
    title: 'Multi-formats automatique',
    description: 'Générez en un export TikTok 9:16, Reels 9:16, Meta 1:1 et YouTube 16:9.',
    detail: 'Adapté à chaque plateforme publicitaire.',
  },
  {
    icon: MonitorPlay,
    iconColor: '#e05151',
    title: 'Hooks publicitaires IA',
    description:
      'Edith identifie le bon plan, le bon mot, le bon rythme dans les 3 premières secondes.',
    detail: 'Hook rate optimisé dès la première itération.',
  },
  {
    icon: Tag,
    iconColor: '#e5b364',
    title: 'Bibliothèque créative',
    description:
      'Templates UGC, storytelling, comparatif, avant/après, démonstration produit.',
    detail: "Choisissez l'angle, Edith fait le reste.",
  },
  {
    icon: Crown,
    iconColor: '#a78bfa',
    title: 'Qualité broadcast',
    description:
      'Rendu 4K, audio mixé, sous-titres lisibles, couleurs étalonnées automatiquement.',
    detail: 'Prêt à publier sans retouche manuelle.',
  },
  {
    icon: MousePointer2,
    iconColor: '#4ade80',
    title: 'Sous-titres animés',
    description:
      'Captions dynamiques avec emphases, mots-clés, et animations adaptées à votre brand.',
    detail: 'Lisibles sans son, optimisés pour le scroll.',
  },
  {
    icon: Clock,
    iconColor: '#f472b6',
    title: 'Génération express',
    description:
      'De vos rushs à la créa finale en moins de 2 minutes, sans intervention humaine.',
    detail: "Testez 10 angles dans le temps d'un café.",
  },
];

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
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="flex flex-col justify-between"
              style={{
                gap: '32px',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                backgroundColor: 'rgba(255,255,255,0.012)',
                border: '1px solid rgba(255,255,255,0.078)',
                borderRadius: '16px',
                padding: '32px',
                minHeight: '340px',
                transition: 'all 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
              }}
            >
              {/* Icon (32x32, icon-l size) */}
              <div
                className="flex items-center"
                style={{ width: '32px', height: '32px' }}
              >
                <Icon
                  className="size-8"
                  style={{ color: feature.iconColor }}
                  strokeWidth={1.5}
                />
              </div>

              {/* Title + paragraphs (mt-auto pushes them down) */}
              <div className="flex flex-col" style={{ gap: '24px', marginTop: 'auto' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: '22px',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.8,
                    letterSpacing: '-0.02em',
                    color: '#ffffffb8',
                  }}
                >
                  {feature.description}
                </p>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.8,
                    letterSpacing: '-0.02em',
                    color: '#ffffff7a',
                  }}
                >
                  {feature.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  </section>
);
