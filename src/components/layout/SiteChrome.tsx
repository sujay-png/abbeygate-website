'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/features/cart/components/CartDrawer';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname === '/checkout' || pathname.startsWith('/checkout/');

  return (
    <>
      {!isCheckout && <Navbar />}
      <main className="flex-1 bg-brand-cream">{children}</main>
      {!isCheckout && <Footer />}
      <CartDrawer />
    </>
  );
}
