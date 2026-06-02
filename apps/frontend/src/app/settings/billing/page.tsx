import Link from 'next/link';
import { Button } from '@/components/buttons/button';

const BillingSettingsPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-white/[0.04] p-8">
        <Link href="/dashboard" className="text-sm text-neutral-400">
          Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Facturation</h1>
        <p className="mt-3 text-neutral-400">
          Le portail client Stripe sera disponible quand `BILLING_DISABLED=false` et les clés Stripe seront
          configurées.
        </p>
        <div className="mt-6 rounded-md bg-neutral-900 p-4 text-sm text-neutral-300">
          Mode actuel: facturation désactivée, crédits mockés pour tester le pipeline Edith.
        </div>
        <Button asChild className="mt-6">
          <Link href="/pricing">Voir les plans</Link>
        </Button>
      </div>
    </main>
  );
};

export default BillingSettingsPage;
