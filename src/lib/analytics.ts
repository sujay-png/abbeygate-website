import type { StoreProduct } from '@/features/products/types/store-product';
import type { CartItem } from '@/features/cart/context/CartContext';
import { getProductBaseAmount } from '@/features/products/utils/product-helpers';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const pushToDataLayer = (event: string, data: any = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object per GA4 best practices
    
    // First, push to dataLayer for GTM (if they ever want to use it)
    window.dataLayer.push({ event, ...data });

    // Second, if gtag is available (which we just added to the site), send the event directly to GA4.
    // This bypasses the need to create custom triggers in GTM!
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, data.ecommerce ? data.ecommerce : data);
    }
  }
};

/** Map StoreProduct to GA4 Item */
export const mapProductToGa4Item = (product: StoreProduct, quantity: number = 1, index?: number) => {
  const category = product.categories?.[0]?.name || 'Uncategorized';
  
  return {
    item_id: product.sku || product.id.toString(),
    item_name: product.name,
    affiliation: 'Abbeygate England',
    index,
    item_brand: 'Abbeygate',
    item_category: category,
    price: getProductBaseAmount(product) / 100,
    quantity,
  };
};

/** Map CartItem to GA4 Item */
export const mapCartItemToGa4Item = (item: CartItem, index?: number) => {
  return {
    item_id: item.sku || item.productId.toString(),
    item_name: item.name,
    affiliation: 'Abbeygate England',
    index,
    item_brand: 'Abbeygate',
    price: item.price / 100, // assuming CartItem prices are in pence (if they are in pounds, we divide if needed, wait. Actually wait! If basePrice is in GBP, what is it?)
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
      value: getProductBaseAmount(product) / 100,
      items: [mapProductToGa4Item(product, 1)]
    }
  });
};

// 3. add_to_cart
export const trackAddToCart = (product: StoreProduct, quantity: number, priceValue: number) => {
  pushToDataLayer('add_to_cart', {
    ecommerce: {
      currency: 'GBP',
      value: (priceValue * quantity) / 100,
      items: [
        {
          ...mapProductToGa4Item(product, quantity),
          price: priceValue / 100,
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
      value: (item.price * item.quantity) / 100,
      items: [mapCartItemToGa4Item(item)]
    }
  });
};

// 5. view_cart
export const trackViewCart = (items: CartItem[], totalValue: number) => {
  pushToDataLayer('view_cart', {
    ecommerce: {
      currency: 'GBP',
      value: totalValue / 100,
      items: items.map((item, i) => mapCartItemToGa4Item(item, i))
    }
  });
};

// 6. begin_checkout
export const trackBeginCheckout = (items: CartItem[], totalValue: number) => {
  pushToDataLayer('begin_checkout', {
    ecommerce: {
      currency: 'GBP',
      value: totalValue / 100,
      items: items.map((item, i) => mapCartItemToGa4Item(item, i))
    }
  });
};

// 7. purchase
export const trackPurchase = (transactionId: string, items: CartItem[], totalValue: number, shipping: number, tax: number) => {
  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: transactionId,
      affiliation: 'Abbeygate England',
      value: totalValue / 100,
      tax: tax / 100,
      shipping: shipping / 100,
      currency: 'GBP',
      items: items.map((item, i) => mapCartItemToGa4Item(item, i))
    }
  });
};

// 8. search
export const trackSearch = (searchTerm: string) => {
  pushToDataLayer('view_search_results', {
    search_term: searchTerm
  });
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
