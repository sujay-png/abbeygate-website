'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/features/cart/context/CartContext';

export function ClearCartOnLoad({ transactionId }: { transactionId?: string }) {
  const { items, total, shippingCost, vatCost, clearCart, isHydrated } = useCart();
  const hasClearedRef = useRef(false);

  useEffect(() => {
    if (isHydrated && !hasClearedRef.current) {
      hasClearedRef.current = true;
      if (items.length > 0) {
        // Track the purchase right before clearing the cart!
        import('@/lib/analytics').then(({ trackPurchase }) => {
          trackPurchase(
            transactionId || `TXN-${Date.now()}`,
            items,
            total,
            shippingCost,
            vatCost
          );
        });
      }
      clearCart();
    }
  }, [isHydrated, clearCart, items, total, shippingCost, vatCost, transactionId]);

  return null;
}
