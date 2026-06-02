import Link from 'next/link';
import { Button } from '@/components/buttons/button';

const plans = [
  { name: 'Free', price: '0 €', credits: '3 exports test', description: 'Pour valider le workflow.' },
  { name: 'Starter', price: '9,99 €/mois', credits: 'Crédits mensuels', description: 'Pour lancer des tests créatifs réguliers.' },
  { name: 'Pro', price: '19,99 €/mois', credits: 'Plus de crédits', description: 'Exports sans watermark et plus de volume.' },
  { name: 'Scale', price: '49 €/mois', credits: 'Volume élevé', description: 'Pour boutiques et agences dropshipping.' },
];

const PricingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="max-w-2xl">
          <Link href="/" className="text-sm text-neutral-400">
            Edith
          </Link>
          <h1 className="mt-4 text-4xl font-semibold">Plans et crédits</h1>
          <p className="mt-3 text-neutral-400">
            Le MVP fonctionne avec `BILLING_DISABLED=true`. Stripe sera branché sans bloquer le pipeline de rendu.
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-3 text-2xl font-semibold">{plan.price}</p>
              <p className="mt-3 text-sm text-emerald-300">{plan.credits}</p>
              <p className="mt-3 text-sm text-neutral-400">{plan.description}</p>
              <Button asChild className="mt-6 w-full" variant={plan.name === 'Pro' ? 'default' : 'outline'}>
                <Link href="/projects/new">Tester</Link>
              </Button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
};

export default PricingPage;
