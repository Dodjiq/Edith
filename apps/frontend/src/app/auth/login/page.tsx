'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Clapperboard, LockKeyhole, Sparkles } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const LoginPage = () => {
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
    <main className="grid min-h-screen bg-[#030303] text-[#f4f1ed] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[0.07] p-10 lg:block">
        <div className="absolute -left-24 top-12 h-28 w-96 rotate-12 rounded-full border border-white/[0.08] bg-[#2b1714]/40 blur-sm" />
        <Link href="/" className="relative z-10 flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
            <Clapperboard className="size-4" />
          </span>
          Edith
        </Link>
        <div className="relative z-10 mt-28 max-w-xl">
          <p className="mb-5 text-[11px] uppercase text-[#8f7066]">/ Workspace createur</p>
          <h1 className="text-5xl font-medium leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Reviens a tes campagnes, variantes et exports.
          </h1>
          <p className="mt-6 text-sm leading-7 text-[#9f9690]">
            Connecte-toi pour creer un projet, uploader un rush produit et suivre les rendus Modal depuis le dashboard.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 text-sm font-semibold lg:hidden">
            <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
              <Clapperboard className="size-4" />
            </span>
            Edith
          </Link>

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[11px] text-[#b8aaa2]">
            <LockKeyhole className="size-3 text-[#e7b59f]" />
            Connexion securisee Supabase
          </div>
          <h1 className="text-4xl font-medium" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Connexion
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#9f9690]">Accede a tes projets Edith et lance tes prochaines variantes ads.</p>

          <form action={signIn} className="mt-8 space-y-4">
            <input name="email" required className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder="email@boutique.com" type="email" />
            <input name="password" required className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder="Mot de passe" type="password" />
            {error && <p className="text-sm text-[#ef8f7d]">{error}</p>}
            <Button disabled={isSubmitting} className="h-12 w-full rounded-full bg-[#f1ece6] text-[#100d0b] hover:bg-white" type="submit">
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-md border border-white/[0.07] bg-white/[0.025] p-4 text-sm text-[#9f9690]">
            <Sparkles className="mb-3 size-4 text-[#e7b59f]" />
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-[#f4f1ed] underline underline-offset-4">
              Creer un espace Edith
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
