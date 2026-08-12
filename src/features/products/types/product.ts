/** WooCommerce REST API product types (wc/v3/products). */

export type WooCommerceImage = {
  id: number;
  src: string;
  name: string;
  alt: string;
};

export type WooCommerceCategory = {
  id: number;
  name: string;
  slug: string;
};

export type WooCommerceProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: "simple" | "grouped" | "external" | "variable";
  status: "draft" | "pending" | "private" | "publish";
  featured: boolean;
  catalog_visibility: "visible" | "catalog" | "search" | "hidden";
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  stock_status: "instock" | "outofstock" | "onbackorder";
  stock_quantity: number | null;
  images: WooCommerceImage[];
  categories: WooCommerceCategory[];
  tags: { id: number; name: string; slug: string }[];
  attributes: {
    id: number;
    name: string;
    slug: string;
    options: string[];
  }[];
  variations: number[];
  average_rating: string;
  rating_count: number;
};

export type ProductListParams = {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  slug?: string;
  status?: "draft" | "pending" | "private" | "publish";
  featured?: boolean;
  orderby?: "date" | "id" | "include" | "title" | "slug" | "price" | "popularity" | "rating";
  order?: "asc" | "desc";
};
