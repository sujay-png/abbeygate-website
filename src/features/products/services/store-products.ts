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
    { params },
  );

  return { products: data, total, totalPages };
}

export async function getAllStoreProductsByCategory(
  categoryId: number,
): Promise<StoreProduct[]> {
  const allProducts: StoreProduct[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await getStoreProducts({ categoryId, page, perPage: 100 });
    allProducts.push(...result.products);
    totalPages = result.totalPages;
    page++;
  }

  return allProducts;
}

export async function getStoreProductBySlug(
  slug: string,
): Promise<StoreProduct | null> {
  const products = await storeFetch<StoreProduct[]>("/products", {
    params: { slug },
  });
  return products[0] ?? null;
}

export async function getStoreProductById(
  id: number,
): Promise<StoreProduct> {
  return storeFetch<StoreProduct>(`/products/${id}`);
}

export async function getStoreCategories(): Promise<StoreCategory[]> {
  return storeFetch<StoreCategory[]>("/products/categories", {
    params: { per_page: 100 },
  });
}

export async function getStoreAttributes(): Promise<StoreAttribute[]> {
  return storeFetch<StoreAttribute[]>("/products/attributes");
}

export async function getStoreAttributeTerms(
  attributeId: number,
): Promise<StoreAttributeTerm[]> {
  return storeFetch<StoreAttributeTerm[]>(
    `/products/attributes/${attributeId}/terms`,
    { params: { per_page: 100 } },
  );
}

export async function getFeaturedStoreProducts(
  limit = 4,
): Promise<StoreProduct[]> {
  const { products } = await getStoreProducts({ perPage: limit });
  return products.slice(0, limit);
}
