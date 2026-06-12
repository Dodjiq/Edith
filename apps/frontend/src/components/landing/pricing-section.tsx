'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { PRICING_PLANS } from '@/lib/constants';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useLocale } from '@/i18n/locale-context';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import type { TranslationKey } from '@/i18n/translations';

const formatPrice = (price: number, locale: 'fr' | 'en'): string => {
  if (price === 0) return locale === 'fr' ? '0€' : '$0';
  const formatted = Number.isInteger(price)
    ? `${price}`
    : price.toFixed(2).replace('.', locale === 'fr' ? ',' : '.');
  return locale === 'fr' ? `${formatted}€` : `$${formatted}`;
};

export const PricingSection: React.FC = () => {
  const { billingCycle, setBillingCycle } = useUiStore();
  const { locale, t } = useLocale();

  return (
    <section id="pricing" className="bg-edith-bg" style={{ padding: '120px 5%' }}>
      <div style={{ width: '100%', maxWidth: '1216px', margin: '0 auto' }}>
        {/* Top row — title left + toggle right */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end"
          style={{ marginBottom: '80px' }}
        >
          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '600px',
              color: 'transparent',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.56), #ffffff 75%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              margin: 0,
            }}
          >
            {t('pricing.title')}
          </motion.h2>

          {/* Toggle — sliding pill (Mensuel / Annuel) */}
          <motion.div
            variants={fadeUp}
            role="group"
            aria-label="Cycle de facturation"
            className="relative inline-flex items-center shrink-0"
            style={{
              padding: '4px',
              borderRadius: '99px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          >
            {(['monthly', 'annual'] as const).map((cycle) => {
              const isActive = billingCycle === cycle;
              return (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  aria-pressed={isActive}
                  className="relative inline-flex items-center"
                  style={{
                    padding: '8px 18px',
                    gap: '8px',
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: isActive ? '#0a0f0f' : 'rgba(255,255,255,0.6)',
                    borderRadius: '99px',
                    transition: 'color 0.3s cubic-bezier(0.6, 0.6, 0, 1)',
                    zIndex: 1,
                  }}
                >
                  {cycle === 'monthly' ? t('pricing.monthly') : t('pricing.annual')}
                  {cycle === 'annual' && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isActive ? 'rgba(10,15,15,0.12)' : 'rgba(81,224,207,0.18)',
                        color: isActive ? '#0a0f0f' : '#51e0cf',
                        letterSpacing: '0.02em',
                      }}
                    >
                      −30%
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="pricing-toggle"
                      className="absolute inset-0"
                      style={{
                        borderRadius: '99px',
                        backgroundColor: '#ffffff',
                        zIndex: -1,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {PRICING_PLANS.map((plan) => {
            const price = billingCycle === 'annual'
              ? plan.price.annual / 12
              : plan.price.monthly;

            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3, ease: [0.6, 0.6, 0, 1] }}
                className="relative flex flex-col overflow-hidden"
                style={{
                  padding: '40px 32px',
                  borderRadius: '28px',
                  border: isPopular
                    ? '1px solid rgba(81,224,207,0.35)'
                    : '1px solid rgba(255,255,255,0.078)',
                  backgroundColor: isPopular ? '#06302b' : 'rgba(255,255,255,0.012)',
                  backgroundImage: isPopular
                    ? 'radial-gradient(circle at 30% 0%, rgba(81,224,207,0.35) 0%, rgba(18,139,135,0.18) 35%, rgba(6,48,43,0) 75%)'
                    : 'none',
                  boxShadow: isPopular
                    ? '0 30px 80px -20px rgba(81,224,207,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
                    : 'none',
                  transition: 'box-shadow 0.4s cubic-bezier(0.6, 0.6, 0, 1)',
                }}
              >
                {/* Subtle mint pattern overlay on popular card */}
                {isPopular && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><g stroke='%2351e0cf' stroke-width='0.5' stroke-opacity='0.2' fill='none'><path d='M100 90 v20 M90 100 h20'/></g></svg>")`,
                      backgroundSize: '200px 200px',
                      opacity: 0.4,
                      mixBlendMode: 'soft-light',
                    }}
                  />
                )}

                {/* Plan name + popular badge */}
                <div className="relative flex items-center" style={{ gap: '10px', marginBottom: '20px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                      fontSize: '24px',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      color: '#ffffff',
                      margin: 0,
                    }}
                  >
                    {t(plan.nameKey as TranslationKey)}
                  </h3>
                  {isPopular && (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontFamily: 'var(--font-space-grotesk), sans-serif',
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        backgroundColor: 'rgba(81,224,207,0.18)',
                        color: '#51e0cf',
                        border: '1px solid rgba(81,224,207,0.3)',
                      }}
                    >
                      {t('pricing.popular')}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="relative flex items-baseline" style={{ gap: '6px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-space-grotesk), sans-serif',
                      fontSize: '48px',
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      color: '#ffffff',
                    }}
                  >
                    {formatPrice(price, locale)}
                  </span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{t('pricing.perMonth')}</span>
                </div>

                {/* Description */}
                <p
                  className="relative"
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.55)',
                    marginBottom: '28px',
                  }}
                >
                  {t(plan.descKey as TranslationKey)}
                </p>

                {/* CTA button — ShimmerButton (white for popular, dark otherwise) */}
                <ShimmerButton
                  onClick={() => { window.location.href = '/login'; }}
                  background={isPopular ? '#ffffff' : '#0a0f0f'}
                  shimmerColor={
                    isPopular ? 'rgba(81,224,207,0.7)' : 'rgba(81,224,207,0.85)'
                  }
                  shimmerDuration="2.8s"
                  borderRadius="99px"
                  className="w-full px-6 py-3.5 text-[14px]"
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    letterSpacing: '-0.01em',
                    color: isPopular ? '#06302b' : '#ffffff',
                    marginBottom: '32px',
                    border: isPopular
                      ? '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {t(plan.ctaKey as TranslationKey)}
                </ShimmerButton>

                {/* Features list */}
                <ul className="relative flex flex-col" style={{ gap: '14px' }}>
                  {plan.featureKeys.map((featureKey) => (
                    <li
                      key={featureKey}
                      className="flex items-start"
                      style={{ gap: '12px' }}
                    >
                      <Check
                        className="shrink-0"
                        style={{
                          width: '18px',
                          height: '18px',
                          color: isPopular ? '#51e0cf' : 'rgba(255,255,255,0.5)',
                          marginTop: '2px',
                        }}
                        strokeWidth={2.5}
                      />
                      <span
                        style={{
                          fontSize: '14px',
                          lineHeight: 1.5,
                          color: isPopular ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)',
                        }}
                      >
                        {t(featureKey as TranslationKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footnote */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.6, 0.6, 0, 1], delay: 0.2 }}
          className="text-center"
          style={{
            marginTop: '40px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          {t('pricing.footnote')}
        </motion.p>
      </div>
    </section>
  );
};
