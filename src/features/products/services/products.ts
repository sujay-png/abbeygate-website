import { woocommerceFetch } from "@/lib/woocommerce/client";
import type {
  ProductListParams,
  WooCommerceProduct,
} from "../types/product";

export async function getProducts(
  params?: ProductListParams,
): Promise<WooCommerceProduct[]> {
  return woocommerceFetch<WooCommerceProduct[]>({
    path: "/products",
    params,
  });
}

export async function getProduct(
  id: number | string,
): Promise<WooCommerceProduct> {
  return woocommerceFetch<WooCommerceProduct>({
    path: `/products/${id}`,
  });
}

export async function getProductBySlug(
  slug: string,
): Promise<WooCommerceProduct | null> {
  const products = await woocommerceFetch<WooCommerceProduct[]>({
    path: "/products",
    params: { slug },
  });

  return products[0] ?? null;
}

export async function getFeaturedProducts(
  limit = 4,
): Promise<WooCommerceProduct[]> {
  return getProducts({
    featured: true,
    per_page: limit,
    status: "publish",
    orderby: "popularity",
    order: "desc",
  });
}
