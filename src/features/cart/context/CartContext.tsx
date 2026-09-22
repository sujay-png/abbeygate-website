'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react';
import type { LogoCustomization } from '@/features/products/types/store-product';
import type { StoreProduct, PriceTier } from '@/features/products/types/store-product';
import { calculateShipping } from '@/features/products/utils/shipping';
import { VAT_RATE, calculateProductPrice, CUSTOMIZATION_MIN_QTY } from '@/features/products/utils/pricing';
import * as idb from '@/lib/idb';
import toast from 'react-hot-toast';
import { fetchActiveCart, syncActiveCart } from '@/features/cart/services/active-cart-sync';

export type CartColourOption = {
  productId: string;
  productName: string;
  name: string;
  slug: string;
  hex: string;
  imageSrc?: string;
};

export type ProofStatus = 'ready' | 'pending' | 'failed';

export interface CartItem {
  key: string;
  productId: string;
  sku?: string;
  slug?: string;
  variationId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  attributes?: { name: string; value: string }[];
  customization?: LogoCustomization;
  categorySlugs?: string[];
  
  colourGroupId?: string;
  colour?: { name: string; slug: string; hex: string };
  colourOptions?: CartColourOption[];
  proofStatus?: ProofStatus;
  
  basePrice?: number;
  priceTiers?: PriceTier[];
  isGifts?: boolean;
  
  proofGeometry?: { widthMm: number; heightMm: number; isDiary: boolean };
}

export type PricedItem = CartItem & {
  unitPrice: number;
  lineTotal: number;
  groupQuantity: number;
};

interface CartContextValue {
  items: CartItem[];
  pricedItems: PricedItem[];
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
  updateItem: (key: string, patch: Partial<CartItem>) => Promise<void>;
  insertItemAfter: (afterKey: string, item: Omit<CartItem, 'key'> & { key?: string }) => Promise<string>;
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

export const CartProvider = ({ children, userId }: { children: ReactNode, userId?: number }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadCartFromStorage().then(storedItems => {
      setItems(storedItems);
      setHydrated(true);

      // Attempt to fetch and merge active cart from remote
      fetchActiveCart().then(remoteCart => {
        if (remoteCart && remoteCart.length > 0) {
          setItems(prevItems => {
            // Merge logic: For simplicity, we can replace the local cart if the remote cart has items,
            // or merge by appending missing items. Let's merge by key to avoid duplicates.
            const merged = [...prevItems];
            for (const rItem of remoteCart) {
              if (!merged.find(i => i.key === rItem.key)) {
                merged.push(rItem);
              }
            }
            return merged;
          });
        }
      }).catch(console.error);
    });
  }, []);

  // When userId changes (e.g. login), fetch the active cart again.
  // We use a separate useEffect so it runs when userId becomes available.
  const prevUserIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (userId && userId !== prevUserIdRef.current) {
      prevUserIdRef.current = userId;
      
      fetchActiveCart().then(remoteCart => {
        setItems(prevItems => {
          let merged = [...prevItems];
          let changed = false;
          
          if (remoteCart && remoteCart.length > 0) {
            for (const rItem of remoteCart) {
              if (!merged.find(i => i.key === rItem.key)) {
                merged.push(rItem);
                changed = true;
              }
            }
          }
          
          // Even if we didn't add any items from remote, the user just logged in.
          // They might have local items (guest cart) that were never synced.
          // We must sync the current merged cart to remote now that they are logged in!
          if (merged.length > 0) {
            setTimeout(() => {
              syncActiveCart(merged).catch(console.error);
            }, 0);
          }

          return changed ? merged : prevItems;
        });
      }).catch(console.error);
    }
  }, [userId]);

  // Sync to remote with debounce whenever items change and we are hydrated
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (hydrated) {
      saveCartToStorage(items);
      
      // Debounced sync to remote
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncActiveCart(items).catch(console.error);
      }, 2000);
    }
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openCart') === 'true') {
        // Use a small timeout to ensure everything is mounted
        setTimeout(() => {
          openCart();
          params.delete('openCart');
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }, 100);
      }
    }
  }, [openCart]);

  const addItem = useCallback(async (item: Omit<CartItem, 'key'> & { key?: string }) => {
    setIsLoading(true);
    try {
      const customKey = item.customization?.enabled ? '-custom' : '';
      const key =
        item.key ??
        `${item.productId}${item.variationId ? `-${item.variationId}` : ''}${customKey}-${Date.now()}`;

      const safeItem = { ...item, key, colourGroupId: item.colourGroupId ?? key };
      setItems((prev) => [...prev, safeItem as CartItem]);
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
          style: { background: '#333', color: '#fff' }
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

  const updateItem = useCallback(async (key: string, patch: Partial<CartItem>) => {
    setIsLoading(true);
    try {
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const insertItemAfter = useCallback(async (afterKey: string, item: Omit<CartItem, 'key'> & { key?: string }) => {
    setIsLoading(true);
    try {
      const customKey = item.customization?.enabled ? '-custom' : '';
      const newKey =
        item.key ??
        `${item.productId}${item.variationId ? `-${item.variationId}` : ''}${customKey}-${Date.now()}`;

      const safeItem = { ...item, key: newKey, colourGroupId: item.colourGroupId ?? newKey };
      
      setItems((prev) => {
        const index = prev.findIndex(i => i.key === afterKey);
        if (index === -1) return [...prev, safeItem as CartItem];
        const next = [...prev];
        next.splice(index + 1, 0, safeItem as CartItem);
        return next;
      });
      return newKey;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const pricedItems = useMemo<PricedItem[]>(() => {
    return items.map(item => {
      const groupQuantity = item.colourGroupId
        ? items.filter(i => (i.colourGroupId ?? i.key) === (item.colourGroupId ?? item.key)).reduce((sum, i) => sum + i.quantity, 0)
        : item.quantity;
      
      let unitPrice = item.price;
      if (item.basePrice !== undefined) {
        unitPrice = calculateProductPrice({
          quantity: groupQuantity,
          basePrice: item.basePrice,
          tiers: item.priceTiers ?? [],
          customizationEnabled: !(item.isGifts ?? false) && item.quantity >= CUSTOMIZATION_MIN_QTY && !!item.customization?.enabled,
          blockingType: item.customization?.choice,
          cornerEdges: item.customization?.cornerEdges,
          cornerEdgePrice: (item.customization as any)?.cornerEdgesPrice || 0,
          isGifts: item.isGifts ?? false,
        }).unitPrice;
      }
      
      return {
        ...item,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
        groupQuantity
      };
    });
  }, [items]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => pricedItems.reduce((sum, i) => sum + i.lineTotal, 0), [pricedItems]);

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

  const vatCost = useMemo(() => subtotal * VAT_RATE, [subtotal]);
  const total = subtotal + shippingCost + vatCost;

  const value: CartContextValue = {
    items,
    pricedItems,
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
    updateItem,
    insertItemAfter,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
