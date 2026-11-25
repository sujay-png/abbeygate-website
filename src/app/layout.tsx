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
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  display: "swap",
});

import { getSEOMetadata, SITE_URL } from '@/lib/seo';

// Site-wide defaults only. The canonical URL is deliberately left out: anything set here is
// inherited by every page without its own metadata, which previously made all of them
// canonicalise to the homepage. Each page sets its own canonical via getSEOMetadata.
const { alternates: _homeAlternates, ...siteDefaults } = getSEOMetadata("/");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...siteDefaults,
  verification: {
    google: [
      '31kkVfB6guiKvc8ysrsj2jJm63OU2lmDc7cAGkeWyLU',
      'google782821a38f6fc6f0',
    ],
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
  const isGa4Production =
    process.env.NODE_ENV === "production" &&
    (!process.env.VERCEL || process.env.VERCEL_ENV === "production");

  return (
    <html
      lang="en"
      className={`${didactGothic.variable} ${workSans.variable} ${josefinSans.variable} antialiased bg-brand-cream`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to WordPress backend domain for faster media & checkout requests */}
        <link rel="preconnect" href="https://dashboard.abbeygate-business.com" />
        <link rel="dns-prefetch" href="https://dashboard.abbeygate-business.com" />
      </head>

      <body
        className="min-h-screen flex flex-col bg-brand-cream text-brand-body"
        suppressHydrationWarning
      >
        {isGa4Production && (
          <>
            <Suspense fallback={null}>
              <NavigationTracker />
            </Suspense>
            {/* GA4 Script (Production Only) */}
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-9H299B89WM"
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                var host = window.location.hostname;
                if (host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.vercel.app')) {
                  window.dataLayer = window.dataLayer || [];
                  window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
                  window.gtag('js', new Date());
                  window.gtag('config', 'G-9H299B89WM', {
                    page_path: window.location.pathname,
                  });
                }
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity (Marketing / SEO Behavioral Tracking) */}
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "zg3vxleuf0");
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
