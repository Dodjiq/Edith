import { LogOut } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from '@/components/buttons/button';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

type SignOutButtonVariant = 'ghost' | 'outline' | 'default';

type SignOutButtonProps = {
  variant?: SignOutButtonVariant;
};

export const SignOutButton = async ({ variant = 'ghost' }: SignOutButtonProps) => {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('auth');
  const action = getPathname({ href: '/auth/sign-out', locale });

  return (
    <form action={action} method="POST">
      <Button
        type="submit"
        variant={variant}
        className="gap-2 border-white/15 bg-transparent text-white hover:bg-white/10"
      >
        <LogOut className="size-4" />
        {t('sign_out_button')}
      </Button>
    </form>
  );
};
