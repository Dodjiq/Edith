'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LocaleSwitcher = () => {
  const t = useTranslations('locale_switcher');
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: string) => {
    if (nextLocale === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale as (typeof routing.locales)[number] });
    });
  };

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5 text-[11px] uppercase tracking-wide sm:inline-flex"
    >
      {routing.locales.map((loc) => {
        const isActive = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            disabled={isPending}
            onClick={() => handleChange(loc)}
            className={
              isActive
                ? 'rounded-full bg-[#f1ece6] px-2.5 py-1 text-[#130f0d]'
                : 'rounded-full px-2.5 py-1 text-[#9f9690] transition hover:text-white'
            }
            aria-pressed={isActive}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
};

export default LocaleSwitcher;
