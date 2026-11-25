'use client';

import { useEffect, useRef } from 'react';
import { useCart } from '@/features/cart/context/CartContext';
import type { PurchaseTrackingInput } from '@/lib/analytics';

const TRACKED_PURCHASES_KEY = 'abbeygate-tracked-purchases';

function hasAlreadyTrackedPurchase(transactionId: string): boolean {
  if (typeof window === 'undefined' || !transactionId) return false;
  try {
    const raw = window.sessionStorage.getItem(TRACKED_PURCHASES_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(transactionId);
  } catch {
    return false;
  }
}

function markPurchaseTracked(transactionId: string) {
  if (typeof window === 'undefined' || !transactionId) return;
  try {
    const raw = window.sessionStorage.getItem(TRACKED_PURCHASES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? Array.from(new Set([...list, transactionId])).slice(-20) : [transactionId];
    window.sessionStorage.setItem(TRACKED_PURCHASES_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function ClearCartOnLoad({
  transactionId,
  purchase,
}: {
  transactionId?: string;
  purchase?: PurchaseTrackingInput;
}) {
  const { items, total, shippingCost, vatCost, clearCart, isHydrated } = useCart();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    const resolvedTransactionId =
      purchase?.transactionId || transactionId || `TXN-${Date.now()}`;

    if (!hasAlreadyTrackedPurchase(resolvedTransactionId)) {
      if (purchase) {
        // Prefer authoritative server order totals (accounts for coupons, shipping, VAT, and Order ID)
        markPurchaseTracked(resolvedTransactionId);
        import('@/lib/analytics').then(({ trackPurchase }) => {
          trackPurchase(purchase);
        });
      } else if (items.length > 0) {
        markPurchaseTracked(resolvedTransactionId);
        import('@/lib/analytics').then(({ trackPurchase }) => {
          trackPurchase(resolvedTransactionId, items, total, shippingCost, vatCost);
        });
      }
    }

    clearCart();
  }, [isHydrated, clearCart, items, total, shippingCost, vatCost, transactionId, purchase]);

  return null;
}
