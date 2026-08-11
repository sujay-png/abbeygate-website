'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { LogoCustomization } from '@/features/products/types/store-product';
import type { StoreProduct } from '@/features/products/types/store-product';
import { calculateShipping } from '@/features/products/utils/shipping';

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

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // FUTURE: replace the body of this function with a call to
  // POST /wp-json/wc/store/v1/cart/add-item, then setItems(response.items).
  // Keep the signature and the `openCart()` call — everything downstream
  // (drawer UI, badge count) reads from `items`/`isLoading` and won't need
  // to change.
  const addItem = useCallback(async (item: Omit<CartItem, 'key'> & { key?: string }) => {
    setIsLoading(true);
    try {
      const customKey = item.customization?.enabled ? '-custom' : '';
      const key = item.key ?? `${item.productId}${item.variationId ? `-${item.variationId}` : ''}${customKey}-${Date.now()}`;

      setItems((prev) => [...prev, { ...item, key }]);
      openCart();
    } finally {
      setIsLoading(false);
    }
  }, [openCart]);

  // FUTURE: POST /wp-json/wc/store/v1/cart/remove-item { key }
  const removeItem = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      setItems((prev) => prev.filter((i) => i.key !== key));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // FUTURE: POST /wp-json/wc/store/v1/cart/update-item { key, quantity }
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

  const total = subtotal + shippingCost;

  const value: CartContextValue = {
    items,
    isOpen,
    isLoading,
    itemCount,
    subtotal,
    shippingCost,
    shippingLabel,
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
