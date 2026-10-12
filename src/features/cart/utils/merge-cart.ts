import type { CartItem } from '../context/CartContext';

function getItemSignature(item: CartItem): string {
  const parts = [
    item.productId,
    item.variationId || '',
    item.colourGroupId || '',
    item.customization?.choice || '',
    item.customization?.foilColor || '',
    item.customization?.position || '',
    item.customization?.cornerEdges || '',
  ];
  return parts.join('::');
}

/**
 * Merges local browser cart items with cloud (Redis) cart items.
 * Ensures items present in either cart are preserved without duplicate lines.
 */
export function mergeCarts(localItems: CartItem[], cloudItems: CartItem[]): CartItem[] {
  if (!cloudItems || cloudItems.length === 0) return localItems;
  if (!localItems || localItems.length === 0) return cloudItems;

  const mergedMap = new Map<string, CartItem>();

  // 1. Seed with cloud items
  for (const item of cloudItems) {
    const sig = getItemSignature(item);
    mergedMap.set(sig, item);
  }

  // 2. Overlay local items (local items take precedence for user's immediate local changes)
  for (const localItem of localItems) {
    const sig = getItemSignature(localItem);
    const existing = mergedMap.get(sig);

    if (existing) {
      // If same product exists in both, keep local item (it may hold fresh local logoFile in IDB)
      // and ensure quantity reflects the latest active session
      mergedMap.set(sig, {
        ...existing,
        ...localItem,
        quantity: Math.max(localItem.quantity, existing.quantity),
      });
    } else {
      mergedMap.set(sig, localItem);
    }
  }

  return Array.from(mergedMap.values());
}
