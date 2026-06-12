import type { Metadata } from 'next';
import Script from "next/script";
import { Inter, Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import Provider from './Provider';
import { LocaleProvider } from '@/i18n/locale-context';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Edith — Montage vidéo IA pour e-commerce',
  description:
    'Edith transforme vos vidéos produits, rushs UGC et vidéos concurrentes en créas publicitaires prêtes à tester sur TikTok, Reels, Shorts, Facebook Ads et WhatsApp.',
  keywords: [
    'montage vidéo IA',
    'vidéo e-commerce',
    'créa publicitaire',
    'TikTok Ads',
    'Facebook Ads',
    'UGC',
    'COD Afrique',
    'SaaS e-commerce',
  ],
  openGraph: {
    title: 'Edith — Montage vidéo IA pour e-commerce',
    description:
      'Produisez plus de vidéos publicitaires en moins de temps avec Edith.',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/mcp/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <LocaleProvider>
          <Provider>{children}</Provider>
        </LocaleProvider>
      </body>
    </html>
  );
}
