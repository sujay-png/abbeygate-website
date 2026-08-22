import type { Metadata, Viewport } from "next";
import { Didact_Gothic, Work_Sans, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from '@/features/cart/context/CartContext';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { Toaster } from 'react-hot-toast';
import { LenisProvider } from '@/components/layout/LenisProvider';



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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://corporate.abbeygate-england.com'),
  title: {
    template: "%s | Abbeygate England",
    default: "Abbeygate England | Your Brand, Our Craftsmanship",
  },
  description: "Elevate your corporate gifting and bespoke merchandise with our expertly customised leather goods.",
  openGraph: {
    title: "Abbeygate England",
    description: "Your Brand, Our Craftsmanship",
    url: "/",
    siteName: "Abbeygate England",
    images: [
      {
        url: "/images/banners/hero-banner.png",
        width: 1200,
        height: 630,
        alt: "Abbeygate England Hero Image",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abbeygate England",
    description: "Your Brand, Our Craftsmanship",
    images: ["/images/banners/hero-banner.png"],
  },
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
      className={`${didactGothic.variable} ${workSans.variable} ${josefinSans.variable} h-full antialiased bg-brand-cream`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-brand-cream text-brand-body"
        suppressHydrationWarning
      >
        <LenisProvider>
          <CartProvider>
            <Suspense fallback={null}><Navbar /></Suspense>
            <main className="flex-1 bg-brand-cream">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <Toaster position="bottom-left" toastOptions={{ duration: 4000, style: { background: '#341a3d', color: '#fff' } }} />
          </CartProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
