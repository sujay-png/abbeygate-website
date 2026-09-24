export type CheckoutCustomizationInput = {
  enabled: boolean;
  choice?: string;
  cornerEdges?: string;
};

export type CheckoutQuoteItemInput = {
  productId: string;
  variationId?: string;
  quantity: number;
  colourGroupId?: string;
  customization?: CheckoutCustomizationInput;
};

export type CheckoutQuoteRequest = {
  items: CheckoutQuoteItemInput[];
};

export type CheckoutQuoteLine = {
  productId: string;
  variationId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type CheckoutQuote = {
  currency: 'GBP';
  expiresAt: string;
  lines: CheckoutQuoteLine[];
  subtotal: number;
  shipping: { label: string; cost: number };
  vat: number;
  total: number;
  warnings: string[];
};
