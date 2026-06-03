'use client';

import { useState } from 'react';
import { ArrowRight, BadgeCheck, Clapperboard, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const RegisterPage = () => {
  const router = useRouter();
  const t = useTranslations('auth.register');
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

    setMessage(t('success'));
    router.refresh();
  };

  const perkKeys = ['upload', 'presets', 'modal', 'credits'] as const;

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
            {t('badge')}
          </div>
          <h1 className="text-4xl font-medium" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#9f9690]">{t('subtitle')}</p>

          <form action={signUp} className="mt-8 space-y-4">
            <input name="shopName" className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder={t('shop_placeholder')} />
            <input name="email" required className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder={t('email_placeholder')} type="email" />
            <input name="password" required minLength={8} className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50" placeholder={t('password_placeholder')} type="password" />
            {error && <p className="text-sm text-[#ef8f7d]">{error}</p>}
            {message && <p className="text-sm text-[#8cc49d]">{message}</p>}
            <Button disabled={isSubmitting} className="h-12 w-full rounded-full bg-[#f1ece6] text-[#100d0b] hover:bg-white" type="submit">
              {isSubmitting ? t('submitting') : t('submit')}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-[#9f9690]">
            {t('have_account')}{' '}
            <Link href="/auth/login" className="text-[#f4f1ed] underline underline-offset-4">
              {t('sign_in')}
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden border-l border-white/[0.07] p-10 lg:block">
        <div className="absolute -right-20 top-20 h-20 w-72 rotate-[24deg] rounded-full border border-white/[0.08] bg-[#342522]/80 blur-sm" />
        <div className="relative z-10 mt-24 max-w-xl">
          <p className="mb-5 text-[11px] uppercase text-[#8f7066]">{t('side_label')}</p>
          <h2 className="text-5xl font-medium leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('side_title')}
          </h2>
          <div className="mt-10 grid gap-4">
            {perkKeys.map((key) => (
              <div key={key} className="flex items-center justify-between border-b border-white/[0.07] py-4 text-sm text-[#d8d0c9]">
                {t(`perks.${key}`)}
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
