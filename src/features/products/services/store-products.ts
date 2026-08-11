import { cache } from "react";
import { storeFetch, storeFetchWithHeaders } from "@/lib/woocommerce/store-api";
import type {
  StoreProduct,
  StoreCategory,
  StoreAttribute,
  StoreAttributeTerm,
} from "../types/store-product";

export type ProductListOptions = {
  categoryId?: number;
  page?: number;
  perPage?: number;
  search?: string;
  slug?: string;
};

export async function getStoreProducts(
  options: ProductListOptions = {},
): Promise<{ products: StoreProduct[]; total: number; totalPages: number }> {
  const { categoryId, page = 1, perPage = 100, search, slug } = options;

  const params: Record<string, string | number> = {
    page,
    per_page: perPage,
  };

  if (categoryId) params.category = categoryId;
  if (search) params.search = search;
  if (slug) params.slug = slug;

  const { data, total, totalPages } = await storeFetchWithHeaders<StoreProduct[]>(
    "/products",
    { params, revalidate: 120 },
  );

  return { products: data, total, totalPages };
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
