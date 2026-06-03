import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, Clapperboard, Mail, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

const topicKeys = ['partnership', 'support', 'billing'] as const;

const ContactPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const tNav = await getTranslations('nav');

  return (
    <main className="min-h-screen bg-[#030303] px-5 py-8 text-[#f4f1ed] sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-[#e7b59f] text-[#130b08]">
            <Clapperboard className="size-4" />
          </span>
          Edith
        </Link>
        <Button asChild className="rounded-full bg-[#f1ece6] text-[#130f0d] hover:bg-white">
          <Link href="/auth/register">{tNav('try')}</Link>
        </Button>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] uppercase text-[#8f7066]">{t('section_label')}</p>
          <h1
            className="mt-4 text-5xl font-medium leading-tight md:text-7xl"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {t('title')}
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#9f9690]">{t('subtitle')}</p>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-white/[0.08] bg-white/[0.035] text-[#e7b59f]">
              <Mail className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">{t('direct_title')}</h2>
              <p className="text-sm text-[#8f8781]">{t('direct_detail')}</p>
            </div>
          </div>
          <div className="grid gap-4">
            <input
              className="h-12 rounded-md border border-white/[0.08] bg-[#0c0c0c] px-4 text-sm outline-none placeholder:text-[#6f6863]"
              placeholder={t('form.name_placeholder')}
            />
            <input
              className="h-12 rounded-md border border-white/[0.08] bg-[#0c0c0c] px-4 text-sm outline-none placeholder:text-[#6f6863]"
              placeholder={t('form.email_placeholder')}
              type="email"
            />
            <textarea
              className="min-h-36 rounded-md border border-white/[0.08] bg-[#0c0c0c] px-4 py-3 text-sm outline-none placeholder:text-[#6f6863]"
              placeholder={t('form.message_placeholder')}
            />
            <Button asChild className="h-12 rounded-full bg-[#f1ece6] text-[#100d0b] hover:bg-white">
              <a href="mailto:contact@edith.video?subject=Contact%20Edith">
                {t('form.send')}
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 border-t border-white/[0.07] py-12 md:grid-cols-3">
        {topicKeys.map((key) => (
          <article key={key} className="border-t border-white/[0.08] pt-5">
            <MessageSquareText className="mb-5 size-5 text-[#e7b59f]" />
            <h2 className="text-sm font-semibold">{t(`topics.${key}.title`)}</h2>
            <p className="mt-3 text-sm leading-7 text-[#8f8781]">{t(`topics.${key}.detail`)}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default ContactPage;
