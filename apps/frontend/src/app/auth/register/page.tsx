'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, BadgeCheck, Clapperboard, Wand2 } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const RegisterPage = () => {
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
    <main className="grid min-h-screen bg-[#030303] text-[#f4f1ed] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 text-sm font-semibold">
            <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
              <Clapperboard className="size-4" />
            </span>
            Edith
          </Link>

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-[11px] text-[#b8aaa2]">
            <Wand2 className="size-3 text-[#e7b59f]" />
            Nouveau workspace
          </div>
          <h1 className="text-4xl font-medium" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Creer un compte
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#9f9690]">Prepare ton premier pipeline: upload, preset, brief, variantes.</p>

          <form action={signUp} className="mt-8 space-y-4">
            <input name="shopName" className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder="Nom de la boutique" />
            <input name="email" required className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder="email@boutique.com" type="email" />
            <input name="password" required minLength={8} className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder="Mot de passe" type="password" />
            {error && <p className="text-sm text-[#ef8f7d]">{error}</p>}
            {message && <p className="text-sm text-[#8cc49d]">{message}</p>}
            <Button disabled={isSubmitting} className="h-12 w-full rounded-full bg-[#f1ece6] text-[#100d0b] hover:bg-white" type="submit">
              {isSubmitting ? 'Creation...' : 'Creer mon espace'}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-[#9f9690]">
            Deja inscrit ?{' '}
            <Link href="/auth/login" className="text-[#f4f1ed] underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-white/[0.07] p-10 lg:block">
        <div className="absolute -right-20 top-20 h-20 w-72 rotate-[24deg] rounded-full border border-white/[0.08] bg-[#342522]/80 blur-sm" />
        <div className="relative z-10 mt-24 max-w-xl">
          <p className="mb-5 text-[11px] uppercase text-[#8f7066]">/ Ce que tu obtiens</p>
          <h2 className="text-5xl font-medium leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Un dashboard pour produire des variantes ads, pas pour bricoler une timeline.
          </h2>
          <div className="mt-10 grid gap-4">
            {['Upload direct Supabase Storage', 'Presets UGC, e-commerce et demo produit', 'Jobs Modal prets pour FFmpeg', 'Credits et Stripe preparables'].map((item) => (
              <div key={item} className="flex items-center justify-between border-b border-white/[0.07] py-4 text-sm text-[#d8d0c9]">
                {item}
                <BadgeCheck className="size-4 text-[#8cc49d]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
