'use client';

import { Container } from '@/components/shared/container';
import { EdithGirlIcon } from '@/components/shared/edith-girl-icon';
import { useT } from '@/i18n/locale-context';
import type { TranslationKey } from '@/i18n/translations';

type FooterLink = { labelKey: TranslationKey; href: string; icon?: 'twitter' | 'tiktok' | 'mail' };
type FooterColumn = { titleKey: TranslationKey; links: ReadonlyArray<FooterLink> };

const FOOTER_COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    titleKey: 'footer.product',
    links: [
      { labelKey: 'footer.link.features', href: '#features' },
      { labelKey: 'footer.link.pricing', href: '#pricing' },
      { labelKey: 'footer.link.tools', href: '#workflow' },
      { labelKey: 'footer.link.blog', href: '#blog' },
    ],
  },
  {
    titleKey: 'footer.legal',
    links: [
      { labelKey: 'footer.link.privacy', href: '#' },
      { labelKey: 'footer.link.terms', href: '#' },
      { labelKey: 'footer.link.refund', href: '#' },
      { labelKey: 'footer.link.legal', href: '#' },
    ],
  },
  {
    titleKey: 'footer.social',
    links: [
      { labelKey: 'footer.link.twitter', href: 'https://twitter.com', icon: 'twitter' },
      { labelKey: 'footer.link.tiktok', href: 'https://tiktok.com', icon: 'tiktok' },
      { labelKey: 'footer.link.contact', href: 'mailto:hello@edith.app', icon: 'mail' },
    ],
  },
];

const SocialIcon: React.FC<{ kind: 'twitter' | 'tiktok' | 'mail' }> = ({ kind }) => {
  if (kind === 'twitter') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (kind === 'tiktok') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.6a8.16 8.16 0 0 0 4.77 1.52V6.69z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </svg>
  );
};

export const Footer: React.FC = () => {
  const t = useT();
  return (
    <footer
      className="relative border-t border-white/5 bg-edith-bg"
      style={{ paddingTop: '88px', overflow: 'hidden' }}
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left — brand + tagline */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className="flex items-center gap-2">
              <EdithGirlIcon className="size-7 text-edith-accent" />
              <span
                className="text-white"
                style={{
                  fontFamily: 'var(--font-space-grotesk), sans-serif',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                Edith
              </span>
            </div>
            <p
              style={{
                maxWidth: '320px',
                fontSize: '14px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {t('footer.description')}
            </p>
          </div>

          {/* Right — 3 columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-3 lg:gap-12">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.titleKey} className="flex flex-col gap-5">
                <h3
                  style={{
                    fontFamily: 'var(--font-space-grotesk), sans-serif',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  {t(col.titleKey)}
                </h3>
                <ul className="flex flex-col" style={{ gap: '12px' }}>
                  {col.links.map((link) => (
                    <li key={link.labelKey}>
                      <a
                        href={link.href}
                        className="inline-flex items-center transition-colors duration-300"
                        style={{
                          gap: '8px',
                          fontSize: '14px',
                          color: 'rgba(255,255,255,0.75)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#51e0cf'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                      >
                        {link.icon && (
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <SocialIcon kind={link.icon} />
                          </span>
                        )}
                        {t(link.labelKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            marginTop: '64px',
            marginBottom: '24px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        />

        {/* Bottom row */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {t('footer.copyright')}
          </p>
          <p
            className="inline-flex items-center"
            style={{ gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}
          >
            {t('footer.madeWith')} <span style={{ color: '#51e0cf' }}>♥</span>{' '}
            {t('footer.forEcommerce')}
          </p>
        </div>
      </Container>

      {/* Giant decorative wordmark — single SVG with icon + EDITH text aligned to container edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none"
        style={{ marginTop: '48px', width: '100%', overflow: 'hidden' }}
      >
        <Container>
          <svg
            viewBox="0 0 1216 280"
            preserveAspectRatio="xMidYMax meet"
            style={{
              width: '100%',
              display: 'block',
              filter: 'drop-shadow(0 0 60px rgba(81,224,207,0.12))',
            }}
          >
            <defs>
              <linearGradient id="edith-wordmark" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(81,224,207,0.22)" />
                <stop offset="55%" stopColor="rgba(81,224,207,0.10)" />
                <stop offset="100%" stopColor="rgba(81,224,207,0)" />
              </linearGradient>
              <linearGradient id="edith-wordmark-outline" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(81,224,207,0.42)" />
                <stop offset="100%" stopColor="rgba(81,224,207,0)" />
              </linearGradient>
            </defs>

            {/* EDITH text — anchored to right edge (x=1216), textLength stretches to fill 1010 units */}
            <text
              x="1216"
              y="244"
              textAnchor="end"
              fontFamily="var(--font-space-grotesk), sans-serif"
              fontSize="260"
              fontWeight="700"
              letterSpacing="-10"
              textLength="1010"
              lengthAdjust="spacingAndGlyphs"
              fill="url(#edith-wordmark)"
              stroke="url(#edith-wordmark-outline)"
              strokeWidth="0.6"
            >
              EDITH
            </text>

            {/* Edith girl icon — at left edge (x=0), scaled 8x to 192px tall, vertically centered with text baseline */}
            <g
              transform="translate(0, 60) scale(8)"
              fill="none"
              stroke="rgba(81,224,207,0.36)"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.25 11.2C6.25 7.45 8.7 4.75 12 4.75s5.75 2.7 5.75 6.45" strokeWidth="1.7" />
              <path d="M7.8 10.4c1.85-.25 3.35-1.12 4.2-2.45.85 1.33 2.35 2.2 4.2 2.45" strokeWidth="1.7" />
              <path d="M8.05 11.2v1.3a3.95 3.95 0 0 0 7.9 0v-1.3" strokeWidth="1.7" />
              <path d="M10 12.15h.01M14 12.15h.01" strokeWidth="2" />
              <path d="M10.55 14.45c.8.55 2.1.55 2.9 0" strokeWidth="1.5" />
              <path d="M8.35 18.1c.78-1.05 2.08-1.7 3.65-1.7s2.87.65 3.65 1.7" strokeWidth="1.7" />
              <path d="M12 3.55c-.75-.85-1.92-.85-2.65-.1M12 3.55c.75-.85 1.92-.85 2.65-.1" strokeWidth="1.5" />
            </g>
          </svg>
        </Container>
      </div>
    </footer>
  );
};
