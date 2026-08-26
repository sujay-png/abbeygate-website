import { describe, it, expect } from 'vitest';
import { getGroupQuantity, validateCustomisationMinimums } from './colour-group';
import type { CartItem } from '../context/CartContext';
import { CUSTOMIZATION_MIN_QTY } from '@/features/products/utils/pricing';

const createMockItem = (overrides: Partial<CartItem>): CartItem => ({
  key: 'mock-key',
  productId: '1',
  slug: 'mock-slug',
  name: 'Mock Product',
  image: 'mock.jpg',
  price: 10,
  quantity: 10,
  attributes: [],
  categorySlugs: [],
  ...overrides,
});

describe('colour-group utilities', () => {
  describe('getGroupQuantity', () => {
    it('returns own quantity for single-line groups', () => {
      const item = createMockItem({ key: 'item-1', quantity: 15 });
      expect(getGroupQuantity([item], item)).toBe(15);
    });

    it('groups by colourGroupId and sums quantities', () => {
      const item1 = createMockItem({ key: 'item-1', colourGroupId: 'group-A', quantity: 10 });
      const item2 = createMockItem({ key: 'item-2', colourGroupId: 'group-A', quantity: 15 });
      const item3 = createMockItem({ key: 'item-3', colourGroupId: 'group-B', quantity: 5 });

      const items = [item1, item2, item3];
      
      expect(getGroupQuantity(items, item1)).toBe(25);
      expect(getGroupQuantity(items, item2)).toBe(25);
      expect(getGroupQuantity(items, item3)).toBe(5);
    });

    it('falls back to item.key when missing colourGroupId', () => {
      const item1 = createMockItem({ key: 'item-1', quantity: 10 });
      // item2 explicitly claims to be in item1's group
      const item2 = createMockItem({ key: 'item-2', colourGroupId: 'item-1', quantity: 15 });
      
      const items = [item1, item2];
      
      expect(getGroupQuantity(items, item1)).toBe(25);
      expect(getGroupQuantity(items, item2)).toBe(25);
    });
  });

  describe('validateCustomisationMinimums', () => {
    const customConfig = {
      enabled: true as const,
      choice: 'Foil blocked',
      position: 'Center',
      positionLabel: 'center',
      logoScale: 1,
      cornerEdges: 'None' as const
    };

    it('returns no shortfalls when customisation meets minimum', () => {
      const item = createMockItem({ 
        key: 'item-1', 
        quantity: CUSTOMIZATION_MIN_QTY, 
        customization: customConfig 
      });
      
      expect(validateCustomisationMinimums([item])).toHaveLength(0);
    });

    it('returns a shortfall when customisation is below minimum', () => {
      const quantity = CUSTOMIZATION_MIN_QTY - 5;
      const item = createMockItem({ 
        key: 'item-1', 
        quantity, 
        customization: customConfig 
      });
      
      const result = validateCustomisationMinimums([item]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ groupId: 'item-1', shortfall: 5 });
    });

    it('combines grouped items to reach minimum', () => {
      const item1 = createMockItem({ 
        key: 'item-1', 
        colourGroupId: 'group-A', 
        quantity: 15, 
        customization: customConfig 
      });
      const item2 = createMockItem({ 
        key: 'item-2', 
        colourGroupId: 'group-A', 
        quantity: 10, 
        customization: customConfig 
      });
      
      // 15 + 10 = 25 (meets minimum)
      expect(validateCustomisationMinimums([item1, item2])).toHaveLength(0);
    });

    it('combines grouped items but still falls short', () => {
      const item1 = createMockItem({ 
        key: 'item-1', 
        colourGroupId: 'group-A', 
        quantity: 10, 
        customization: customConfig 
      });
      const item2 = createMockItem({ 
        key: 'item-2', 
        colourGroupId: 'group-A', 
        quantity: 10, 
        customization: customConfig 
      });
      
      // 10 + 10 = 20 (short by 5)
      const result = validateCustomisationMinimums([item1, item2]);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ groupId: 'group-A', shortfall: 5 });
    });

    it('ignores non-customized items and gifts', () => {
      const customItem = createMockItem({ 
        key: 'item-1', 
        quantity: 10, 
        customization: customConfig 
      });
      
      const nonCustomItem = createMockItem({ 
        key: 'item-2', 
        quantity: 5 
      });
      
      const giftItem = createMockItem({ 
        key: 'item-3', 
        quantity: 50, 
        isGifts: true, 
        customization: customConfig 
      });
      
      const result = validateCustomisationMinimums([customItem, nonCustomItem, giftItem]);
      // Only item-1 is validated, and it is short by 15
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ groupId: 'item-1', shortfall: CUSTOMIZATION_MIN_QTY - 10 });
    });
  });
});
