import { cache } from "react";
import { storeFetch, storeFetchWithHeaders } from "@/lib/woocommerce/store-api";
import type {
  StoreProduct,
  StoreCategory,
  StoreAttribute,
  StoreAttributeTerm,
} from "../types/store-product";
import { woocommerceApi } from "@/lib/woocommerce/client";

export type ProductListOptions = {
  categoryId?: number | string;
  tagId?: number;
  page?: number;
  perPage?: number;
  search?: string;
  slug?: string;
  featured?: boolean;
};

export async function getStoreProducts(
  options: ProductListOptions = {},
): Promise<{ products: StoreProduct[]; total: number; totalPages: number }> {
  const { categoryId, tagId, page = 1, perPage = 100, search, slug } = options;

  const params: Record<string, string | number> = {
    page,
    per_page: perPage,
  };

  if (categoryId) params.category = categoryId;
  if (tagId) params.tag = tagId;
  if (search) params.search = search;
  if (slug) params.slug = slug;
  if (options.featured !== undefined) params.featured = String(options.featured);

  const { data, total, totalPages } = await storeFetchWithHeaders<StoreProduct[]>(
    "/products",
    { params, revalidate: 120 },
  );

  return { products: data, total, totalPages };
}

/** Fetch category products (capped pages for speed). */
export async function getAllStoreProductsByCategory(
  categoryId: number | string,
  options: { maxPages?: number; perPage?: number } = {},
): Promise<StoreProduct[]> {
  const { maxPages = 3, perPage = 50 } = options;

  // Page 1 tells us how many pages exist; fetch the rest in parallel rather than one by one.
  const first = await getStoreProducts({ categoryId, page: 1, perPage });
  const lastPage = Math.min(first.totalPages, maxPages);
  const rest = await Promise.all(
    Array.from({ length: Math.max(lastPage - 1, 0) }, (_, i) =>
      getStoreProducts({ categoryId, page: i + 2, perPage }),
    ),
  );

  return [first, ...rest].flatMap((result) => result.products);
}

export const getStoreProductBySlug = cache(async (
  slug: string,
): Promise<StoreProduct | null> => {
  const products = await storeFetch<StoreProduct[]>("/products", {
    params: { slug },
    revalidate: 120,
  });
  if (!products || products.length === 0) return null;
  return products[0] ?? null;
});

export const getStoreProductById = cache(async (
  id: number,
): Promise<StoreProduct> => {
  return storeFetch<StoreProduct>(`/products/${id}`, { revalidate: 120 });
});

export async function getStoreCategories(): Promise<StoreCategory[]> {
  return storeFetch<StoreCategory[]>("/products/categories", {
    params: { per_page: 100 },
    revalidate: 300,
  });
}

export const getStoreCategoryById = cache(async (
  id: number,
): Promise<StoreCategory | null> => {
  try {
    return await storeFetch<StoreCategory>(`/products/categories/${id}`, { revalidate: 300 });
  } catch (error) {
    return null;
  }
});

export const getStoreAttributes = cache(async (): Promise<StoreAttribute[]> => {
  return storeFetch<StoreAttribute[]>("/products/attributes", {
    revalidate: 300,
  });
});

export const getStoreAttributeTerms = cache(async (
  attributeId: number,
): Promise<StoreAttributeTerm[]> => {
  return storeFetch<StoreAttributeTerm[]>(
    `/products/attributes/${attributeId}/terms`,
    { params: { per_page: 100 }, revalidate: 300 },
  );
});

export async function getFeaturedStoreProducts(
  limit = 4,
): Promise<StoreProduct[]> {
  // Rely exclusively on the Best Seller tag/category
  const results = await Promise.allSettled([
    getStoreProducts({ perPage: limit, tagId: 158 }),
    getStoreProducts({ perPage: limit, categoryId: 159 })
  ]);

  const tagRes = results[0].status === 'fulfilled' ? results[0].value.products : [];
  const categoryRes = results[1].status === 'fulfilled' ? results[1].value.products : [];

  const combined = [...tagRes, ...categoryRes];
  const uniqueProducts = Array.from(new Map(combined.map(p => [p.id, p])).values());

  return uniqueProducts.slice(0, limit);
}

/** Prefer WooCommerce-generated thumbnails over full-size PNGs. */
export function getProductImageUrl(
  product: StoreProduct,
  size: "thumb" | "full" = "thumb",
): string {
  const image = product.images[0];
  if (!image) return "";
  if (size === "full") return image.src;
  return image.thumbnail || image.src;
}

export type CustomTab = {
  title: string;
  id: string;
  content: string;
};

/** Fetch custom product tabs (e.g., YIKES Custom Product Tabs) via the authenticated v3 API. */
/**
 * Authenticated v3 product record (meta_data holds B2B King tiers and custom tabs).
 * Cached per request so pricing and custom tabs share a single round-trip.
 */
export const getRestProductMeta = cache(async (
  productId: number,
): Promise<{ id: number; meta_data?: { key: string; value: unknown }[] }> => {
  return woocommerceApi.request(`/products/${productId}`, { revalidate: 300 });
});

export const getProductCustomTabs = cache(async (
  productId: number,
): Promise<CustomTab[]> => {
  try {
    const product = await getRestProductMeta(productId);
    const tabsMeta = product.meta_data?.find(meta => meta.key === 'yikes_woo_products_tabs');
    
    if (tabsMeta && Array.isArray(tabsMeta.value)) {
      return tabsMeta.value;
    }
  } catch (error) {
    console.error(`Failed to fetch custom tabs for product ${productId}:`, error);
  }
  return [];
});
