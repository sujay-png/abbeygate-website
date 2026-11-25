'use server';

import { getRecommendedProductsForProduct } from "@/features/products/services/recommendations";
import type { StoreProduct } from "@/features/products/types/store-product";

export async function getRelatedProductsAction({
  categoryId,
  currentProductId,
  currentProductName,
  currentColor,
  manualOverrideIds,
}: {
  categoryId?: number;
  currentProductId?: number;
  currentProductName?: string;
  currentColor?: string;
  manualOverrideIds?: number[];
}): Promise<StoreProduct[]> {
  void categoryId;
  try {
    return await getRecommendedProductsForProduct({
      currentProductId,
      currentProductName,
      currentColor,
      manualOverrideIds,
    });
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return [];
  }
}
