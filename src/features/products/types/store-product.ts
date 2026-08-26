/** WooCommerce Store API product types (wc/store/v1). */

export type StoreProductImage = {
  id: number;
  src: string;
  thumbnail: string;
  alt: string;
  name: string;
  width?: number;
  height?: number;
};

export type StoreProductCategory = {
  id: number;
  name: string;
  slug: string;
  link: string;
};

export type StoreProductTag = {
  id: number;
  name: string;
  slug: string;
  link: string;
};


export type StoreProductAttribute = {
  id: number;
  name: string;
  taxonomy: string;
  has_variations: boolean;
  terms: { id: number; name: string; slug: string }[];
};

export type StoreProductPrices = {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
};

export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: StoreProductPrices;
  price_html: string;
  images: StoreProductImage[];
  categories: StoreProductCategory[];
  tags: StoreProductTag[];
  attributes: StoreProductAttribute[];
  is_purchasable: boolean;
  is_in_stock: boolean;
  average_rating: string;
  review_count: number;
};

export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
  image: { src: string } | null;
  permalink: string;
};

export type StoreAttribute = {
  id: number;
  name: string;
  taxonomy: string;
  count: number;
};

export type StoreAttributeTerm = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export type ProductFilters = {
  filter_collection?: string[];
  filter_colour?: string[];
  filter_layout?: string[];
  filter_size?: string[];
};

export const FILTER_TAXONOMY_MAP = {
  filter_collection: "pa_collection",
  filter_colour: "pa_colour",
  filter_layout: "pa_layout",
  filter_size: "pa_size",
} as const;

export type FilterParamKey = keyof typeof FILTER_TAXONOMY_MAP;

export type PriceTier = {
  min: number;
  max: number | null;
  price: number;
};

export type LogoCustomization = {
  enabled: boolean;
  choice: string;
  foilColor?: string;
  cornerEdges?: string;
  fileUrl?: string;
  fileName?: string;
  logoFile?: File;
  position: string;
  logoPreviewUrl?: string;
  fullPreviewUrl?: string;
  leftPercent?: number;
  topPercent?: number;
  widthPercent?: number;
  imageBounds?: { top: number, bottom: number, left: number, right: number };
  positionLabel?: string;
  logoScale?: number;
};
