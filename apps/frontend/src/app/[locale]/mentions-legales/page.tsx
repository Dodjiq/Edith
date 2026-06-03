import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Clapperboard } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

const fieldKeys = ['editor', 'publisher', 'contact', 'hosting', 'ip', 'status'] as const;

const LegalNoticePage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <main className="min-h-screen bg-[#030303] px-5 py-8 text-[#f4f1ed] sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
            <Clapperboard className="size-4" />
          </span>
          Edith
        </Link>
        <Link href="/contact" className="text-sm text-[#9f9690] hover:text-white">
          {t('nav_contact')}
        </Link>
      </nav>

      <header className="mx-auto max-w-5xl py-20">
        <p className="text-[11px] uppercase text-[#8f7066]">{t('section_label')}</p>
        <h1
          className="mt-4 max-w-3xl text-5xl font-medium leading-tight md:text-7xl"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {t('title')}
        </h1>
      </header>

      <section className="mx-auto max-w-5xl border-t border-white/[0.07] py-12">
        {fieldKeys.map((key) => (
          <div key={key} className="grid gap-3 border-b border-white/[0.07] py-6 md:grid-cols-[220px_1fr]">
            <h2 className="text-sm font-semibold text-[#f4f1ed]">{t(`fields.${key}.title`)}</h2>
            <p className="text-sm leading-7 text-[#8f8781]">{t(`fields.${key}.detail`)}</p>
          </div>
        ))}
      </section>
    </main>
  );
};

export default LegalNoticePage;
