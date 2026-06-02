'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const signIn = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');
    const supabase = createClient();
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-8 space-y-2">
          <Link href="/" className="text-sm text-neutral-400">
            Edith
          </Link>
          <h1 className="text-3xl font-semibold">Connexion</h1>
          <p className="text-sm text-neutral-400">Connecte ton compte pour lancer des variantes publicitaires.</p>
        </div>
        <form action={signIn} className="space-y-4">
          <input name="email" required className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="email@boutique.com" type="email" />
          <input name="password" required className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="Mot de passe" type="password" />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button disabled={isSubmitting} className="w-full" type="submit">
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-neutral-400">
          Pas encore de compte ? <Link href="/auth/register" className="text-white underline">Creer un compte</Link>
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
