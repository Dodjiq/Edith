import type { Metadata } from 'next';
import Script from 'next/script';
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import '../../styles/globals.css';
import Provider from '../Provider';
import { routing } from '@/i18n/routing';

const poppins = localFont({
  src: [
    {
      path: '../../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource/poppins/files/poppins-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Edit — Create winning ads in minutes',
  description:
    'Edit is the AI creative engine that generates high-performing ad creatives from your raw footage. Upload, describe, launch.',
  icons: {
    icon: '/icon.svg',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className="dark">
      <head>
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/@react-grab/mcp/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className={`${poppins.variable} ${inter.variable} antialiased`}>
        <NextIntlClientProvider>
          <Provider>{children}</Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

