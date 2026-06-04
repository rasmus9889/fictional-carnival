import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: {
    default: 'LoopLoot – Unlimited Claude Code',
    template: '%s – LoopLoot',
  },
  description:
    'Use Claude Code without usage limits. Pay as you go, built-in web search, and personal memory across every session. One setting change.',
  metadataBase: new URL('https://looploot.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'LoopLoot',
    title: 'LoopLoot – Unlimited Claude Code',
    description:
      'No usage caps. Web search + memory. Pay as you go. One setting change.',
    url: 'https://looploot.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LoopLoot – Unlimited Claude Code',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoopLoot – Unlimited Claude Code',
    description:
      'No usage caps. Web search + memory. Pay as you go. One setting change.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: 'https://looploot.com' },
};

export const viewport: Viewport = { maximumScale: 1 };

const manrope = Manrope({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser().catch(() => null);

  return (
    <html lang="en" className={manrope.className}>
      <body className="min-h-[100dvh] bg-background text-foreground">
        <SWRConfig value={{ fallback: { '/api/user': user } }}>
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
