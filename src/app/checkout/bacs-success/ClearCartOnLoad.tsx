'use client';

import { useEffect } from 'react';
import { useCart } from '@/features/cart/context/CartContext';

export function ClearCartOnLoad({ transactionId }: { transactionId?: string }) {
  const { items, total, shippingCost, vatCost, clearCart, isHydrated } = useCart();

  useEffect(() => {
    if (isHydrated) {
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
  }, [clearCart, isHydrated, items, total, shippingCost, vatCost, transactionId]);

  return null;
}
