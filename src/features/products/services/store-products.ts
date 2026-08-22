import { cache } from "react";
import { storeFetch, storeFetchWithHeaders } from "@/lib/woocommerce/store-api";
import type {
  StoreProduct,
  StoreCategory,
  StoreAttribute,
  StoreAttributeTerm,
} from "../types/store-product";
import { woocommerceApi } from "@/lib/woocommerce/client";
import probe from "probe-image-size";

const dimensionCache = new Map<string, { width: number; height: number }>();

async function enrichImageDimensions(products: StoreProduct[]): Promise<StoreProduct[]> {
  const promises = products.map(async (product) => {
    const enrichedImages = await Promise.all(
      product.images.map(async (image) => {
        if (!image.src) return image;
        const cacheKey = image.src;
        if (dimensionCache.has(cacheKey)) {
          const dims = dimensionCache.get(cacheKey)!;
          return { ...image, width: dims.width, height: dims.height };
        }
        try {
          const result = await probe(image.src);
          dimensionCache.set(cacheKey, { width: result.width, height: result.height });
          return { ...image, width: result.width, height: result.height };
        } catch (e) {
          console.error("Failed to probe image size for", image.src, e);
          return image;
        }
      })
    );
    return { ...product, images: enrichedImages };
  });
  return Promise.all(promises);
}

export type ProductListOptions = {
  categoryId?: number;
  tagId?: number;
  page?: number;
  perPage?: number;
  search?: string;
  slug?: string;
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

  const { data, total, totalPages } = await storeFetchWithHeaders<StoreProduct[]>(
    "/products",
    { params, revalidate: 120 },
  );

  const enrichedData = await enrichImageDimensions(data);
  return { products: enrichedData, total, totalPages };
}

/** Fetch category products (capped pages for speed). */
export async function getAllStoreProductsByCategory(
  categoryId: number,
  options: { maxPages?: number; perPage?: number } = {},
): Promise<StoreProduct[]> {
  const { maxPages = 3, perPage = 50 } = options;
  const allProducts: StoreProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= maxPages) {
    const result = await getStoreProducts({ categoryId, page, perPage });
    allProducts.push(...result.products);
    totalPages = result.totalPages;
    page++;
  }

  return allProducts;
}

export const getStoreProductBySlug = cache(async (
  slug: string,
): Promise<StoreProduct | null> => {
  const products = await storeFetch<StoreProduct[]>("/products", {
    params: { slug },
    revalidate: 120,
  });
  if (!products || products.length === 0) return null;
  const enriched = await enrichImageDimensions(products);
  return enriched[0] ?? null;
});

export const getStoreProductById = cache(async (
  id: number,
): Promise<StoreProduct> => {
  const product = await storeFetch<StoreProduct>(`/products/${id}`, { revalidate: 120 });
  const enriched = await enrichImageDimensions([product]);
  return enriched[0];
});

export async function getStoreCategories(): Promise<StoreCategory[]> {
  return storeFetch<StoreCategory[]>("/products/categories", {
    params: { per_page: 100 },
    revalidate: 300,
  });
}

export async function getStoreAttributes(): Promise<StoreAttribute[]> {
  return storeFetch<StoreAttribute[]>("/products/attributes", {
    revalidate: 300,
  });
}

export async function getStoreAttributeTerms(
  attributeId: number,
): Promise<StoreAttributeTerm[]> {
  return storeFetch<StoreAttributeTerm[]>(
    `/products/attributes/${attributeId}/terms`,
    { params: { per_page: 100 }, revalidate: 300 },
  );
}

export async function getFeaturedStoreProducts(
  limit = 4,
): Promise<StoreProduct[]> {
  const { products } = await getStoreProducts({ perPage: limit });
  return products.slice(0, limit);
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
export const getProductCustomTabs = cache(async (
  productId: number,
): Promise<CustomTab[]> => {
  try {
    const product = await woocommerceApi.request<{ meta_data: { key: string; value: any }[] }>(`/products/${productId}`, {
      revalidate: 120,
      timeoutMs: 1500, // Fail fast so we don't block the entire page render
    });
    const tabsMeta = product.meta_data.find(meta => meta.key === 'yikes_woo_products_tabs');
    
    if (tabsMeta && Array.isArray(tabsMeta.value)) {
      return tabsMeta.value;
    }
  } catch (error) {
    console.error(`Failed to fetch custom tabs for product ${productId}:`, error);
  }
  return [];
});
