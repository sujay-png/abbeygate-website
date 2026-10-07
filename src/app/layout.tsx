import type { Metadata, Viewport } from "next";
import { Didact_Gothic, Work_Sans, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { CartProvider } from '@/features/cart/context/CartContext';
import { Toaster } from 'react-hot-toast';
import { LenisProvider } from '@/components/layout/LenisProvider';
import { VatProvider } from '@/context/VatContext';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { NavigationTracker } from '@/components/layout/NavigationTracker';
import Script from 'next/script';

const didactGothic = Didact_Gothic({
  weight: "400",
  variable: "--font-didact-gothic",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

import { getSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://dashboard.abbeygate-england.com'),
  ...getSEOMetadata("/"),
  verification: {
    google: '31kkVfB6guiKvc8ysrsj2jJm63OU2lmDc7cAGkeWyLU',
  },
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#F7F1E2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${didactGothic.variable} ${workSans.variable} ${josefinSans.variable} antialiased bg-brand-cream`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
      </head>
      {/* Preconnect to WordPress checkout domain so the TLS handshake is already
          done when the user clicks "Proceed to Checkout" from the cart page. */}
      <link rel="preconnect" href="https://dashboard.abbeygate-england.com" />
      <link rel="dns-prefetch" href="https://dashboard.abbeygate-england.com" />

      <body
        className="min-h-screen flex flex-col bg-brand-cream text-brand-body"
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <NavigationTracker />
        </Suspense>
        {/* GA4 Script (Marketing Team Request) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9H299B89WM"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){window.dataLayer.push(arguments);}
            window.gtag('js', new Date());
            window.gtag('config', 'G-9H299B89WM', {
              page_path: window.location.pathname,
            });
          `}
        </Script>


        <VatProvider>
          <LenisProvider>
            <CartProvider>
              <Suspense fallback={null}><SiteChrome>{children}</SiteChrome></Suspense>
              <Toaster position="bottom-left" toastOptions={{ duration: 4000, style: { background: '#341a3d', color: '#fff' } }} />
            </CartProvider>
          </LenisProvider>
        </VatProvider>
      </body>
    </html>
  );
}
