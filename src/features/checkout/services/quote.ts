import { getProductPricingFromProduct } from '@/features/products/services/pricing';
import { storeFetch } from '@/lib/woocommerce/store-api';
import { calculateProductPrice, getCornerEdgesPricing, VAT_RATE } from '@/features/products/utils/pricing';
import { calculateShipping } from '@/features/products/utils/shipping';
import type { StoreProduct } from '@/features/products/types/store-product';
import type { CheckoutQuote, CheckoutQuoteItemInput, CheckoutQuoteRequest } from '@/features/checkout/types/quote';

const MAX_LINE_ITEMS = 50;
const MAX_LINE_QUANTITY = 10_000;

function validateInput(input: unknown): CheckoutQuoteRequest {
  if (!input || typeof input !== 'object' || !Array.isArray((input as CheckoutQuoteRequest).items)) {
    throw new Error('A cart with at least one item is required.');
  }

  const items = (input as CheckoutQuoteRequest).items;
  if (!items.length || items.length > MAX_LINE_ITEMS) {
    throw new Error('Cart must contain between 1 and 50 items.');
  }

  for (const item of items) {
    if (!item || !/^\d+$/.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_LINE_QUANTITY) {
      throw new Error('One or more cart items are invalid.');
    }
    if (item.variationId && !/^\d+$/.test(item.variationId)) {
      throw new Error('One or more product variations are invalid.');
    }
  }

  return { items };
}

async function getStoreProduct(productId: string): Promise<StoreProduct> {
  return storeFetch<StoreProduct>(`/products/${productId}`, { revalidate: 0 });
}

function groupQuantity(item: CheckoutQuoteItemInput, allItems: CheckoutQuoteItemInput[]): number {
  const groupId = item.colourGroupId;
  if (!groupId) return item.quantity;
  return allItems.filter((candidate) => candidate.colourGroupId === groupId).reduce((sum, candidate) => sum + candidate.quantity, 0);
}

/**
 * Produces a server-side quote from current WooCommerce product data.
 * This quote is a prerequisite for payment; the payment implementation must
 * request a fresh quote and persist it in a durable checkout session.
 */
export async function createCheckoutQuote(payload: unknown): Promise<CheckoutQuote> {
  const { items } = validateInput(payload);
  const products = await Promise.all(items.map((item) => getStoreProduct(item.productId)));

  const lines = await Promise.all(items.map(async (item, index) => {
    const product = products[index];
    if (!product.is_purchasable || !product.is_in_stock) {
      throw new Error(`${product.name} is no longer available.`);
    }

    const pricing = await getProductPricingFromProduct(product);
    const customization = item.customization;
    const cornerEdges = customization?.cornerEdges;
    const cornerEdgePrice = cornerEdges && cornerEdges !== 'None' ? getCornerEdgesPricing(product).pricePerPair : 0;
    const price = calculateProductPrice({
      quantity: groupQuantity(item, items),
      basePrice: pricing.basePrice,
      tiers: pricing.tiers,
      customizationEnabled: Boolean(customization?.enabled),
      blockingType: customization?.choice,
      cornerEdges,
      cornerEdgePrice,
      isGifts: product.categories.some((category) => category.slug === 'gifts'),
    });

    return {
      productId: item.productId,
      variationId: item.variationId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: Number(price.unitPrice.toFixed(2)),
      lineTotal: Number(price.totalPrice.toFixed(2)),
      product,
    };
  }));

  const subtotal = Number(lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2));
  const shipping = calculateShipping(lines.map((line) => ({ product: line.product, quantity: line.quantity })));
  const vat = Number((subtotal * VAT_RATE).toFixed(2));

  return {
    currency: 'GBP',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    lines: lines.map((line) => ({
      productId: line.productId,
      variationId: line.variationId,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    subtotal,
    shipping: { label: shipping.label, cost: Number(shipping.cost.toFixed(2)) },
    vat,
    total: Number((subtotal + shipping.cost + vat).toFixed(2)),
    warnings: ['Coupon validation and checkout-session persistence are the next required steps before payment can be enabled.'],
  };
}
