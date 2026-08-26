import type { CartItem } from '../context/CartContext';
import { CUSTOMIZATION_MIN_QTY } from '@/features/products/utils/pricing';

export function getGroupMembers(items: CartItem[], item: CartItem): CartItem[] {
  const groupId = item.colourGroupId ?? item.key;
  return items.filter(i => (i.colourGroupId ?? i.key) === groupId);
}

export function getGroupQuantity(items: CartItem[], item: CartItem): number {
  const members = getGroupMembers(items, item);
  return members.reduce((sum, member) => sum + member.quantity, 0);
}

export function validateCustomisationMinimums(items: CartItem[]): { groupId: string; shortfall: number }[] {
  const customGroups = new Map<string, number>();

  // Aggregate quantities by groupId for items that have customization enabled and are not gifts
  items.forEach(item => {
    if (item.customization?.enabled && !item.isGifts) {
      const groupId = item.colourGroupId ?? item.key;
      const current = customGroups.get(groupId) || 0;
      customGroups.set(groupId, current + item.quantity);
    }
  });

  const shortfalls: { groupId: string; shortfall: number }[] = [];
  
  customGroups.forEach((quantity, groupId) => {
    if (quantity < CUSTOMIZATION_MIN_QTY) {
      shortfalls.push({ groupId, shortfall: CUSTOMIZATION_MIN_QTY - quantity });
    }
  });

  return shortfalls;
}
