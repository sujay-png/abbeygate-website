'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// Shape mirrors WooCommerce Store API's cart item schema
// (GET /wp-json/wc/store/v1/cart -> items[]) so swapping local state for a
// real fetch later means changing what's inside the functions below, not
// the shape consumed by the UI.
export interface CartItem {
  key: string;        //  to identify a line item + its variation/options
  productId: string;  // maps to WooCommerce product id
  variationId?: string;
  name: string;
  image: string;
  price: number;       
  quantity: number;
  attributes?: { name: string; value: string }[]; // e.g. size/colour variants
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, 'key'> & { key?: string }) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const key = item.key ?? `${item.productId}${item.variationId ? `-${item.variationId}` : ''}`;

      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i));
        }
        return [...prev, { ...item, key }];
      });

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

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value: CartContextValue = {
    items,
    isOpen,
    isLoading,
    itemCount,
    subtotal,
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
