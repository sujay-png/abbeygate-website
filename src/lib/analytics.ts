import type { StoreProduct } from '@/features/products/types/store-product';
import type { CartItem } from '@/features/cart/context/CartContext';
import { getProductBaseAmount } from '@/features/products/utils/product-helpers';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const roundCurrency = (amount: number) =>
  Number((Number.isFinite(amount) ? amount : 0).toFixed(2));

export type Ga4EcommerceItem = {
  item_id: string;
  item_name: string;
  affiliation?: string;
  index?: number;
  item_brand?: string;
  item_category?: string;
  price: number;
  quantity: number;
};

export type PurchaseTrackingInput = {
  transactionId: string;
  value: number;
  shipping?: number;
  tax?: number;
  items?: Array<{
    item_id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
};

export const pushToDataLayer = (event: string, data: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object per GA4 best practices

    // Push to dataLayer for GTM compatibility
    window.dataLayer.push({ event, ...data });

    // Ensure gtag command queue exists even before external gtag.js finishes loading
    if (typeof window.gtag !== 'function') {
      window.gtag = function (..._args: unknown[]) {
        // eslint-disable-next-line prefer-rest-params
        (window.dataLayer as unknown[]).push(arguments);
      };
    }

    window.gtag('event', event, data.ecommerce ? (data.ecommerce as Record<string, unknown>) : data);
  }
};

/** Map StoreProduct to GA4 Item (prices in GBP pounds) */
export const mapProductToGa4Item = (product: StoreProduct, quantity: number = 1, index?: number): Ga4EcommerceItem => {
  const category = product.categories?.[0]?.name || 'Uncategorized';

  return {
    item_id: product.sku || product.id.toString(),
    item_name: product.name,
    affiliation: 'Abbeygate England',
    index,
    item_brand: 'Abbeygate',
    item_category: category,
    price: roundCurrency(getProductBaseAmount(product)),
    quantity,
  };
};

/** Map CartItem to GA4 Item (prices in GBP pounds) */
export const mapCartItemToGa4Item = (item: CartItem, index?: number): Ga4EcommerceItem => {
  return {
    item_id: item.sku || item.productId.toString(),
    item_name: item.name,
    affiliation: 'Abbeygate England',
    index,
    item_brand: 'Abbeygate',
    price: roundCurrency(item.price),
    quantity: item.quantity,
  };
};

// 1. view_item_list (Category page / Grid)
export const trackViewItemList = (listName: string, products: StoreProduct[]) => {
  pushToDataLayer('view_item_list', {
    ecommerce: {
      item_list_id: listName.toLowerCase().replace(/\s+/g, '_'),
      item_list_name: listName,
      items: products.map((p, i) => mapProductToGa4Item(p, 1, i))
    }
  });
};

// 2. view_item (Product Detail Page)
export const trackViewItem = (product: StoreProduct) => {
  pushToDataLayer('view_item', {
    ecommerce: {
      currency: 'GBP',
      value: roundCurrency(getProductBaseAmount(product)),
      items: [mapProductToGa4Item(product, 1)]
    }
  });
};

// 3. add_to_cart (unitPrice in GBP pounds)
export const trackAddToCart = (product: StoreProduct, quantity: number, priceValue: number) => {
  pushToDataLayer('add_to_cart', {
    ecommerce: {
      currency: 'GBP',
      value: roundCurrency(priceValue * quantity),
      items: [
        {
          ...mapProductToGa4Item(product, quantity),
          price: roundCurrency(priceValue),
        }
      ]
    }
  });
};

// 4. remove_from_cart
export const trackRemoveFromCart = (item: CartItem) => {
  pushToDataLayer('remove_from_cart', {
    ecommerce: {
      currency: 'GBP',
      value: roundCurrency(item.price * item.quantity),
      items: [mapCartItemToGa4Item(item)]
    }
  });
};

// 5. view_cart (totalValue in GBP pounds)
export const trackViewCart = (items: CartItem[], totalValue: number) => {
  pushToDataLayer('view_cart', {
    ecommerce: {
      currency: 'GBP',
      value: roundCurrency(totalValue),
      items: items.map((item, i) => mapCartItemToGa4Item(item, i))
    }
  });
};

// 6. begin_checkout (totalValue in GBP pounds)
export const trackBeginCheckout = (items: CartItem[], totalValue: number) => {
  pushToDataLayer('begin_checkout', {
    ecommerce: {
      currency: 'GBP',
      value: roundCurrency(totalValue),
      items: items.map((item, i) => mapCartItemToGa4Item(item, i))
    }
  });
};

// 7. purchase (totals in GBP pounds; supports either authoritative server order payload or legacy CartItem signature)
export const trackPurchase = (
  transactionIdOrPayload: string | PurchaseTrackingInput,
  items?: CartItem[],
  totalValue?: number,
  shipping?: number,
  tax?: number
) => {
  if (typeof transactionIdOrPayload === 'object') {
    const payload = transactionIdOrPayload;
    pushToDataLayer('purchase', {
      ecommerce: {
        transaction_id: payload.transactionId,
        affiliation: 'Abbeygate England',
        value: roundCurrency(payload.value),
        tax: roundCurrency(payload.tax ?? 0),
        shipping: roundCurrency(payload.shipping ?? 0),
        currency: 'GBP',
        items: (payload.items || []).map((item, index) => ({
          item_id: item.item_id,
          item_name: item.item_name,
          affiliation: 'Abbeygate England',
          item_brand: 'Abbeygate',
          index,
          price: roundCurrency(item.price),
          quantity: item.quantity,
        })),
      },
    });
    return;
  }

  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: transactionIdOrPayload,
      affiliation: 'Abbeygate England',
      value: roundCurrency(totalValue ?? 0),
      tax: roundCurrency(tax ?? 0),
      shipping: roundCurrency(shipping ?? 0),
      currency: 'GBP',
      items: (items || []).map((item, i) => mapCartItemToGa4Item(item, i))
    }
  });
};

// 8. search & zero-results monitoring
export const trackSearch = (searchTerm: string, resultsCount: number = 0) => {
  const hasResults = resultsCount > 0;
  const payload = {
    search_term: searchTerm,
    results_count: resultsCount,
    has_results: hasResults,
  };

  // GA4 standard recommended site search event
  pushToDataLayer('search', payload);

  // GTM / view_search_results compatibility
  pushToDataLayer('view_search_results', payload);

  // Dedicated zero-results event for immediate monitoring in GA4
  if (!hasResults) {
    pushToDataLayer('search_no_results', {
      search_term: searchTerm,
      results_count: 0,
    });
  }
};

// 9. filter (custom event)
export const trackFilter = (filterName: string, filterValue: string) => {
  pushToDataLayer('filter_items', {
    filter_name: filterName,
    filter_value: filterValue
  });
};

// 10. customiser flow (custom event)
export const trackCustomiserStep = (stepName: string, productName?: string) => {
  pushToDataLayer(stepName, {
    product_name: productName || 'Unknown'
  });
};
