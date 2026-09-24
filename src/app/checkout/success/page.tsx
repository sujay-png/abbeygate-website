'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '@/features/cart/context/CartContext';

export default function CheckoutSuccessPage() {
  const { clearCart, isHydrated } = useCart();

  useEffect(() => {
    // Only empty the cart AFTER it has fully hydrated from storage
    // Otherwise, the hydration process might overwrite the empty cart with the old cart
    if (isHydrated) {
      clearCart();
    }
  }, [clearCart, isHydrated]);

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="border-b border-[var(--brand-border)] bg-white">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center" aria-label="Abbeygate England home">
            <Image src="/images/logo/abbeygate-logo.png" alt="Abbeygate England" width={200} height={48} priority className="h-11 w-auto object-contain" />
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-5">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 border border-[var(--brand-border)] text-center shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-brand-primary mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-brand-primary-dark mb-4">Order Confirmed!</h1>
          <p className="text-brand-grey mb-8">
            Thank you for your purchase. Your payment was successful and we are now processing your order.
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/" 
              className="block w-full bg-brand-primary text-white font-bold py-3 px-4 hover:bg-brand-primary-dark transition-colors"
            >
              Return to Store
            </Link>
            <Link 
              href="/account/orders" 
              className="block w-full border border-[var(--brand-border)] text-brand-primary-dark font-bold py-3 px-4 hover:bg-brand-tint transition-colors"
            >
              View Order History
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--brand-border)] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-5 py-7 text-center text-[13px] text-brand-grey sm:flex-row sm:px-8 sm:text-left lg:px-12">
          <p>Abbeygate England © 2026</p>
        </div>
      </footer>
    </div>
  );
}
