'use client';

import { useEffect } from 'react';
import { useCart } from '@/features/cart/context/CartContext';

export function ClearCartOnLoad() {
  const { clearCart, isHydrated } = useCart();

  useEffect(() => {
    if (isHydrated) {
      clearCart();
    }
  }, [clearCart, isHydrated]);

  return null;
}
