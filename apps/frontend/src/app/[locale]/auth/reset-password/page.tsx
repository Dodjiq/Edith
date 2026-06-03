'use client';

import { useState } from 'react';
import { ArrowRight, Clapperboard, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/buttons/button';
import { createClient } from '@/utils/supabase/client';

const ResetPasswordPage = () => {
  const router = useRouter();
  const t = useTranslations('auth.reset_password');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const updatePassword = async (formData: FormData) => {
    setError('');
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmPassword) {
      setError(t('mismatch_error'));
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
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
          <p className="mb-5 text-[11px] uppercase text-[#8f7066]">{t('side_label')}</p>
          <h1 className="text-5xl font-medium leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('side_title')}
          </h1>
          <p className="mt-6 text-sm leading-7 text-[#9f9690]">{t('side_subtitle')}</p>
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
            <ShieldCheck className="size-3 text-[#e7b59f]" />
            {t('badge')}
          </div>
          <h1 className="text-4xl font-medium" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#9f9690]">{t('subtitle')}</p>

          <form action={updatePassword} className="mt-8 space-y-4">
            <input
              name="password"
              required
              minLength={8}
              className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50"
              placeholder={t('new_password_placeholder')}
              type="password"
            />
            <input
              name="confirmPassword"
              required
              minLength={8}
              className="h-12 w-full rounded-md border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none transition placeholder:text-[#6f6863] focus:border-[#e7b59f]/50"
              placeholder={t('confirm_password_placeholder')}
              type="password"
            />
            {error && <p className="text-sm text-[#ef8f7d]">{error}</p>}
            <Button
              disabled={isSubmitting}
              className="h-12 w-full rounded-full bg-[#f1ece6] text-[#100d0b] hover:bg-white"
              type="submit"
            >
              {isSubmitting ? t('submitting') : t('submit')}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-[#9f9690]">
            <Link href="/auth/login" className="text-[#f4f1ed] underline underline-offset-4">
              {t('back_to_login')}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
