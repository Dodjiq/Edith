import { Container } from '@/components/shared/container';
import { EdithGirlIcon } from '@/components/shared/edith-girl-icon';

const FOOTER_COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Workflow', href: '#workflow' },
      { label: 'Tarifs', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Fonctionnalités',
    links: [
      { label: 'TikTok Ads', href: '#' },
      { label: 'Meta Ads', href: '#' },
      { label: 'UGC Videos', href: '#' },
    ],
  },
];

export const Footer: React.FC = () => (
  <footer className="border-t border-white/5 bg-edith-bg py-20">
    <Container>
      <div className="grid gap-12 lg:grid-cols-12">
        {/* Left — brand */}
        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="flex items-center gap-2">
            <EdithGirlIcon className="size-7 text-edith-accent" />
            <span className="text-2xl font-semibold text-white">Edith</span>
          </div>
          <p className="max-w-md text-sm leading-5 text-white/50">
            Montage vidéo IA pour e-commerçants qui veulent produire du volume de créas
            publicitaires sans passer la journée sur un logiciel.
          </p>
          <a
            href="mailto:hello@edith.app"
            className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/4 px-6 py-3 text-sm text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/20 hover:bg-white/6"
          >
            hello@edith.app
          </a>
        </div>

        {/* Right — link columns */}
        <div className="grid grid-cols-2 gap-8 lg:col-span-6 lg:gap-12">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white transition-colors hover:text-white/60"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="my-12 border-t border-white/6" />

      {/* Bottom row */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-white/40">© 2025 Edith</p>
        <div className="flex items-center gap-5">
          <a href="#" className="text-sm text-white transition-colors hover:text-white/60">
            Changelog
          </a>
          <span className="h-4 w-px bg-white/10" />
          <a href="#" className="text-sm text-white transition-colors hover:text-white/60">
            Licence
          </a>
        </div>
      </div>
    </Container>
  </footer>
);
