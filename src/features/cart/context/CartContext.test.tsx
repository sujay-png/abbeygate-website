import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart, CartItem } from './CartContext';
import * as idb from '@/lib/idb';

// Mock IDB to prevent actual IndexedDB access in JSDOM
vi.mock('@/lib/idb', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const mockTiers = [
  { min: 1, max: 24, price: 10 },
  { min: 25, max: 49, price: 8 },
  { min: 50, max: null, price: 6 },
];

describe('CartContext & pricedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (idb.get as any).mockResolvedValue([]);
  });

  it('hydrates cart from IDB', async () => {
    (idb.get as any).mockResolvedValue([
      { key: 'item-1', name: 'Saved Item', price: 10, quantity: 1 }
    ]);
    
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    
    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });
    
    expect(result.current.items[0].name).toBe('Saved Item');
  });

  it('derives pricedItems correctly for bulk group tiers', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    // Wait for hydration
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Add two items that belong to the same colour group
    act(() => {
      result.current.addItem({
        key: 'item-1',
        productId: '1',
        name: 'Item 1',
        image: 'img.jpg',
        price: 10,
        basePrice: 10,
        quantity: 15, // line quantity
        priceTiers: mockTiers,
        colourGroupId: 'group-A'
      });
    });

    act(() => {
      result.current.addItem({
        key: 'item-2',
        productId: '2',
        name: 'Item 2',
        image: 'img.jpg',
        price: 10,
        basePrice: 10,
        quantity: 10, // line quantity
        priceTiers: mockTiers,
        colourGroupId: 'group-A'
      });
    });

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    // Total quantity in group is 25. That hits the [25, 49] tier where price = 8.
    // So BOTH items should be priced at 8 per unit minus the 0.52 customization fee logic if applicable.
    // Wait, by default `isGifts` is false, and since customization is NOT enabled here, the 0.52 fee is SUBTRACTED.
    // Base tier price = 8, unitPrice = 8 - 0.52 = 7.48.
    expect(result.current.pricedItems[0].unitPrice).toBe(7.48);
    expect(result.current.pricedItems[0].lineTotal).toBe(7.48 * 15);
    expect(result.current.pricedItems[0].groupQuantity).toBe(25);

    expect(result.current.pricedItems[1].unitPrice).toBe(7.48);
    expect(result.current.pricedItems[1].lineTotal).toBe(7.48 * 10);
    expect(result.current.pricedItems[1].groupQuantity).toBe(25);
  });

  it('handles legacy items with no basePrice or priceTiers', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addItem({
        key: 'legacy-1',
        productId: '1',
        name: 'Legacy',
        image: 'img.jpg',
        price: 12.5,
        quantity: 2,
        // no basePrice, no priceTiers
      });
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    expect(result.current.pricedItems[0].unitPrice).toBe(12.5);
    expect(result.current.pricedItems[0].lineTotal).toBe(25);
  });

  it('subtracts customisation fee when customization is disabled', async () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addItem({
        key: 'item-1',
        productId: '1',
        name: 'Item 1',
        image: 'img.jpg',
        price: 10,
        basePrice: 10,
        quantity: 10,
        priceTiers: mockTiers,
        customization: { enabled: false } as any
      });
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Base price is 10. Tier 1 (1-24) is 10. Customisation disabled removes 0.60.
    // Wait, the fee logic in calculateProductPrice:
    // If not isGifts and customizationEnabled is false, unitPrice = tierPrice - 0.60
    expect(result.current.pricedItems[0].unitPrice).toBe(10 - 0.52);
    expect(result.current.pricedItems[0].lineTotal).toBe((10 - 0.52) * 10);
  });
});
