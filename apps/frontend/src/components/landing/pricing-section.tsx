'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useUiStore } from '@/store/ui-store';
import { Container } from '@/components/shared/container';
import { SectionBadge } from '@/components/shared/section-badge';
import { PRICING_PLANS } from '@/lib/constants';
import { fadeUp, staggerContainer } from '@/lib/motion';

export const PricingSection: React.FC = () => {
  const { billingCycle, setBillingCycle } = useUiStore();

  return (
    <section id="pricing" className="border-t border-white/5 bg-edith-bg py-24 sm:py-32">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col items-center gap-12"
        >
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 text-center">
            <SectionBadge>Tarifs</SectionBadge>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-edith-text sm:text-4xl">
              Commencez gratuitement,{' '}
              <span className="text-edith-accent">scalez quand vous êtes prêt</span>
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/3 p-1"
          >
            {(['monthly', 'annual'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`relative rounded-lg px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  billingCycle === cycle
                    ? 'bg-edith-accent text-edith-bg shadow-sm'
                    : 'text-edith-muted hover:text-edith-text'
                }`}
              >
                {cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                {cycle === 'annual' && billingCycle !== 'annual' && (
                  <span className="ml-1.5 rounded-full bg-edith-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-edith-accent">
                    −17%
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid w-full gap-5 md:grid-cols-3"
          >
            {PRICING_PLANS.map((plan) => {
              const price = billingCycle === 'annual'
                ? Math.round(plan.price.annual / 12)
                : plan.price.monthly;

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeUp}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 ${
                    plan.popular
                      ? 'border-edith-accent/40 bg-edith-accent/5 shadow-[0_0_48px_rgba(81,224,207,0.08)]'
                      : 'border-white/8 bg-white/3'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-edith-accent px-4 py-1 text-xs font-bold text-edith-bg">
                        Populaire
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold text-edith-text">{plan.name}</h3>
                    <p className="text-sm text-edith-muted">{plan.description}</p>
                  </div>

                  <div className="my-6 flex items-end gap-1">
                    <span className="text-4xl font-bold text-edith-text">
                      {price === 0 ? 'Gratuit' : `${price}€`}
                    </span>
                    {price > 0 && (
                      <span className="mb-1 text-sm text-edith-muted">/mois</span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-edith-muted">
                        <Check
                          className={`mt-0.5 size-4 shrink-0 ${
                            plan.popular ? 'text-edith-accent' : 'text-edith-muted'
                          }`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="/login"
                    className={`mt-8 block rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-edith-accent text-edith-bg hover:bg-edith-accent-light hover:shadow-[0_0_24px_rgba(81,224,207,0.3)]'
                        : 'border border-white/12 text-edith-text hover:border-white/24 hover:bg-white/5'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-edith-muted">
            Sans carte bancaire pour commencer · Annulez à tout moment
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
};
