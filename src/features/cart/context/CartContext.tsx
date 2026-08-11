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

/** Strip heavy/base64 fields before writing to localStorage. */
function toPersistentCartItem(item: CartItem): CartItem {
  const { customization, ...rest } = item;

  if (!customization) return rest;

  return {
    ...rest,
    customization: {
      enabled: customization.enabled,
      choice: customization.choice,
      position: customization.position,
      fileName: customization.fileName,
      fileUrl: customization.fileUrl?.startsWith('data:')
        ? undefined
        : customization.fileUrl,
      // Never persist data-URI logo previews — they blow the 5MB quota
      logoPreviewUrl: undefined,
    },
  };
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed.map(toPersistentCartItem) : [];
  } catch {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;

  const payload = JSON.stringify(items.map(toPersistentCartItem));

  try {
    localStorage.setItem(CART_STORAGE_KEY, payload);
  } catch {
    // Quota exceeded — clear old cart and retry once with slim payload
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.setItem(CART_STORAGE_KEY, payload);
    } catch (retryError) {
      console.warn('Unable to persist cart to localStorage:', retryError);
    }
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

      // Drop base64 preview before it ever enters cart state
      const safeItem = toPersistentCartItem({ ...item, key });
      setItems((prev) => [...prev, safeItem]);
      openCart();
    } finally {
      setIsLoading(false);
    }
  }, [openCart]);

  const removeItem = useCallback(async (key: string) => {
    setIsLoading(true);
    try {
      setItems((prev) => prev.filter((i) => i.key !== key));
    } finally {
      setIsLoading(false);
    }
  }, []);

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
