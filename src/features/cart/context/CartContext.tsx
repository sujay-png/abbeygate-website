'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { LogoCustomization } from '@/features/products/types/store-product';
import type { StoreProduct } from '@/features/products/types/store-product';
import { calculateShipping } from '@/features/products/utils/shipping';
import { VAT_RATE } from '@/features/products/utils/pricing';
import * as idb from '@/lib/idb';
import toast from 'react-hot-toast';

export interface CartItem {
  key: string;
  productId: string;
  slug?: string;
  variationId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  attributes?: { name: string; value: string }[];
  customization?: LogoCustomization;
  categorySlugs?: string[];
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  shippingLabel: string;
  vatCost: number;
  total: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'key'> & { key?: string }) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'abbeygate-cart';

async function loadCartFromStorage(): Promise<CartItem[]> {
  if (typeof window === 'undefined') return [];
  const stored = await idb.get<CartItem[]>(CART_STORAGE_KEY);
  return stored || [];
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  idb.set(CART_STORAGE_KEY, items);
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadCartFromStorage().then(storedItems => {
      setItems(storedItems);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveCartToStorage(items);
    }
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(async (item: Omit<CartItem, 'key'> & { key?: string }) => {
    setIsLoading(true);
    try {
      const customKey = item.customization?.enabled ? '-custom' : '';
      const key =
        item.key ??
        `${item.productId}${item.variationId ? `-${item.variationId}` : ''}${customKey}-${Date.now()}`;

      const safeItem = { ...item, key };
      setItems((prev) => [...prev, safeItem]);
      toast.success(`${item.quantity}x ${item.name} added to basket`);
      openCart();
    } finally {
      setIsLoading(false);
    }
  }, [openCart]);

  const removeItem = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      const itemToRemove = items.find((i) => i.key === key);
      if (itemToRemove) {
        toast.success(`${itemToRemove.name} removed from basket`, {
          style: { background: '#341a3d', color: '#fff' }
        });
      }
      setItems((prev) => prev.filter((i) => i.key !== key));
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  const updateQuantity = useCallback(async (key: string, quantity: number) => {
    if (quantity < 1) return removeItem(key);
    setIsLoading(true);
    try {
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)));
    } finally {
      setIsLoading(false);
    }
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const { cost: shippingCost, label: shippingLabel } = useMemo(() => {
    const shippingItems = items.map((item) => ({
      product: {
        categories: (item.categorySlugs ?? []).map((slug) => ({
          id: 0,
          name: slug,
          slug,
          link: '',
        })),
      } as StoreProduct,
      quantity: item.quantity,
    }));
    return calculateShipping(shippingItems);
  }, [items]);

  const vatCost = useMemo(() => (subtotal + shippingCost) * VAT_RATE, [subtotal, shippingCost]);
  const total = subtotal + shippingCost + vatCost;

  const value: CartContextValue = {
    items,
    isOpen,
    isLoading,
    itemCount,
    subtotal,
    shippingCost,
    shippingLabel,
    vatCost,
    total,
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
