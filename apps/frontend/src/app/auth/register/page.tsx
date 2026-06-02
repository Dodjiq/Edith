'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const signUp = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');
    setMessage('');
    const supabase = createClient();
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const shopName = String(formData.get('shopName') ?? '');
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { shop_name: shopName },
      },
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage('Compte cree. Verifie tes emails si la confirmation est activee.');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8">
        <div className="mb-8 space-y-2">
          <Link href="/" className="text-sm text-neutral-400">
            Edith
          </Link>
          <h1 className="text-3xl font-semibold">Creer un compte</h1>
          <p className="text-sm text-neutral-400">Lance ton premier pipeline de variantes ads.</p>
        </div>
        <form action={signUp} className="space-y-4">
          <input name="shopName" className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="Nom de la boutique" />
          <input name="email" required className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="email@boutique.com" type="email" />
          <input name="password" required minLength={8} className="h-11 w-full rounded-md border border-white/10 bg-neutral-900 px-3 text-sm outline-none" placeholder="Mot de passe" type="password" />
          {error && <p className="text-sm text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          <Button disabled={isSubmitting} className="w-full" type="submit">
            {isSubmitting ? 'Creation...' : 'Creer mon compte'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-neutral-400">
          Deja inscrit ? <Link href="/auth/login" className="text-white underline">Se connecter</Link>
        </p>
      </div>
    </main>
  );
};

export default RegisterPage;
