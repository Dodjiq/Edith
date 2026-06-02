import Link from 'next/link';
import { Button } from '@/components/buttons/button';

const RegisterPage: React.FC = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-8 space-y-2">
          <Link href="/" className="text-sm text-neutral-400">
            Edith
          </Link>
          <h1 className="text-3xl font-semibold">Créer un compte</h1>
          <p className="text-sm text-neutral-400">Prêt pour Supabase Auth, non bloquant pendant le mock MVP.</p>
        </div>
        <form className="space-y-4">
          <input className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="Nom de la boutique" />
          <input className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="email@boutique.com" type="email" />
          <input className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="Mot de passe" type="password" />
          <Button asChild className="w-full">
            <Link href="/dashboard">Créer en mode démo</Link>
          </Button>
        </form>
        <p className="mt-6 text-sm text-neutral-400">
          Déjà inscrit ? <Link href="/auth/login" className="text-white underline">Se connecter</Link>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;
