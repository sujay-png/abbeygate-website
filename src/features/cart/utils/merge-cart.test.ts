import { describe, it, expect } from 'vitest';
import { mergeCarts } from './merge-cart';
import type { CartItem } from '../context/CartContext';

describe('mergeCarts', () => {
  const itemA: CartItem = {
    key: 'item-1',
    productId: '100',
    name: 'Diary A',
    price: 15,
    quantity: 2,
    image: '/img1.jpg',
  };

  const itemB: CartItem = {
    key: 'item-2',
    productId: '200',
    name: 'Notebook B',
    price: 10,
    quantity: 5,
    image: '/img2.jpg',
  };

  it('returns local items if cloud cart is empty', () => {
    expect(mergeCarts([itemA], [])).toEqual([itemA]);
  });

  it('returns cloud items if local cart is empty', () => {
    expect(mergeCarts([], [itemB])).toEqual([itemB]);
  });

  it('combines unique items from both carts', () => {
    const merged = mergeCarts([itemA], [itemB]);
    expect(merged).toHaveLength(2);
    expect(merged.map(i => i.productId)).toContain('100');
    expect(merged.map(i => i.productId)).toContain('200');
  });

  it('deduplicates matching items and keeps the higher quantity', () => {
    const cloudItemA = { ...itemA, quantity: 4 };
    const merged = mergeCarts([itemA], [cloudItemA]);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(4);
  });
});
