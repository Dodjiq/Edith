'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlowCard } from '@/components/shared/glow-card';

type PlanKey = 'free' | 'starter' | 'growth' | 'agency';

type PlanInfo = {
  key: PlanKey;
  label: string;
  price: string;
  exports: number;
  priceId: string | null;
  features: string[];
};

const PLANS: PlanInfo[] = [
  {
    key: 'free',
    label: 'Free',
    price: 'Gratuit',
    exports: 2,
    priceId: null,
    features: ['2 exports / mois', 'Accès basique', 'Watermark Edith'],
  },
  {
    key: 'starter',
    label: 'Starter',
    price: 'Gratuit',
    exports: 3,
    priceId: null,
    features: ['3 exports / mois', 'Accès basique', 'Sans watermark'],
  },
  {
    key: 'growth',
    label: 'Growth',
    price: '19 €/mois',
    exports: 30,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH ?? '',
    features: ['30 exports / mois', 'Toutes les fonctionnalités', 'Support prioritaire'],
  },
  {
    key: 'agency',
    label: 'Agency',
    price: '49 €/mois',
    exports: 100,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY ?? '',
    features: ['100 exports / mois', 'Toutes les fonctionnalités', 'Support dédié', 'Onboarding personnalisé'],
  },
];

const PLAN_ORDER: PlanKey[] = ['free', 'starter', 'growth', 'agency'];

type PlanCardsProps = {
  currentPlan: string;
  userId: string;
  userEmail: string;
};

export const PlanCards: React.FC<PlanCardsProps> = ({ currentPlan, userId, userEmail }) => {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan as PlanKey);

  const handleUpgrade = async (plan: PlanInfo) => {
    if (!plan.priceId) return;

    setLoadingPriceId(plan.priceId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL_BACKEND ?? ''}/stripe/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email: userEmail,
            priceId: plan.priceId,
            successUrl: `${window.location.origin}/billing?success=1`,
            cancelUrl: `${window.location.origin}/billing?canceled=1`,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la session de paiement');
      }

      const data = (await response.json()) as { url: string };
      window.location.href = data.url;
    } catch (err) {
      console.error('Upgrade error:', err);
      setLoadingPriceId(null);
    }
  };

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {PLANS.map((plan) => {
        const isCurrentPlan = plan.key === currentPlan;
        const planIndex = PLAN_ORDER.indexOf(plan.key);
        const isUpgradable = planIndex > currentPlanIndex && plan.priceId;
        const isAgency = plan.key === 'agency';
        const isLoading = loadingPriceId === plan.priceId;

        return (
          <GlowCard
            key={plan.key}
            className={cn(
              'flex flex-col',
              isCurrentPlan && 'border-edith-accent/50 bg-edith-accent/5',
            )}
          >
            <div className='mb-3 flex items-start justify-between'>
              <div>
                <p className='text-base font-semibold text-edith-text'>{plan.label}</p>
                <p className='mt-0.5 text-sm text-edith-muted'>{plan.price}</p>
              </div>
              {isCurrentPlan && (
                <span className='rounded-full bg-edith-accent/15 px-2 py-0.5 text-xs font-medium text-edith-accent'>
                  Plan actuel
                </span>
              )}
            </div>

            <p className='mb-4 text-sm font-medium text-edith-text'>
              {plan.exports} export{plan.exports > 1 ? 's' : ''} / mois
            </p>

            <ul className='mb-6 flex-1 space-y-2'>
              {plan.features.map((feature) => (
                <li key={feature} className='flex items-center gap-2 text-xs text-edith-muted'>
                  <Check className='size-3.5 shrink-0 text-edith-accent' />
                  {feature}
                </li>
              ))}
            </ul>

            {isCurrentPlan ? (
              <div className='rounded-lg border border-white/8 py-2 text-center text-xs text-edith-muted'>
                Plan actuel
              </div>
            ) : isAgency && !isUpgradable ? (
              <a
                href='mailto:contact@edith.ai'
                className='block rounded-lg border border-edith-accent/30 py-2 text-center text-xs font-medium text-edith-accent transition-colors hover:bg-edith-accent/10'
              >
                Contacter Sales
              </a>
            ) : isAgency ? (
              <button
                type='button'
                onClick={() => void handleUpgrade(plan)}
                disabled={isLoading}
                className='rounded-lg bg-edith-accent py-2 text-xs font-semibold text-edith-bg transition-opacity hover:opacity-90 disabled:opacity-60'
              >
                {isLoading ? 'Redirection…' : 'Passer à Agency'}
              </button>
            ) : isUpgradable ? (
              <button
                type='button'
                onClick={() => void handleUpgrade(plan)}
                disabled={isLoading}
                className='rounded-lg border border-edith-accent/40 py-2 text-xs font-medium text-edith-accent transition-colors hover:bg-edith-accent/10 disabled:opacity-60'
              >
                {isLoading ? 'Redirection…' : `Passer à ${plan.label}`}
              </button>
            ) : (
              <div className='rounded-lg border border-white/8 py-2 text-center text-xs text-edith-muted/50'>
                Non disponible
              </div>
            )}
          </GlowCard>
        );
      })}
    </div>
  );
};
