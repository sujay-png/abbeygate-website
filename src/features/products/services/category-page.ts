import { getCategoryRoute, getFilterConfigForPath } from '@/data/category-routes';
import { getAllStoreProductsByCategory, getStoreAttributes, getStoreAttributeTerms } from '../services/store-products';
import { parseFiltersFromSearchParams } from '../utils/product-helpers';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';

export async function loadCategoryPageData(path: string, searchParams: Record<string, string | string[] | undefined>) {
  const route = getCategoryRoute(path);

  if (!route) {
    return null;
  }

  let allProducts: StoreProduct[] = [];
  let attributes: StoreAttribute[] = [];

  try {
    allProducts = await getAllStoreProductsByCategory(route.categoryId);
  } catch (error) {
    console.error(`Failed to load products for category ${route.categoryId}:`, error);
    throw error;
  }

  try {
    attributes = await getStoreAttributes();
  } catch (error) {
    // Filters are optional — still show the product grid if attributes 404
    console.warn('Failed to load product attributes for filters:', error);
    attributes = [];
  }

  const filterAttributes = attributes.filter((a) =>
    ['pa_collection', 'pa_colour', 'pa_layout', 'pa_size'].includes(a.taxonomy),
  );

  const attributeTerms: Record<number, StoreAttributeTerm[]> = {};
  await Promise.all(
    filterAttributes.map(async (attr) => {
      try {
        attributeTerms[attr.id] = await getStoreAttributeTerms(attr.id);
      } catch (error) {
        console.warn(`Failed to load terms for attribute ${attr.id}:`, error);
        attributeTerms[attr.id] = [];
      }
    }),
  );

  const filters = parseFiltersFromSearchParams(searchParams);
  const filterConfig = route.filterConfig ?? getFilterConfigForPath(path);

  const pathParts = path.split('/').filter(Boolean);
  const breadcrumbItems = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const label = part
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return index === pathParts.length - 1
      ? { label: route.title }
      : { label, href };
  });

  return {
    title: route.title,
    description: route.description || '',
    breadcrumbItems,
    allProducts,
    filters,
    attributes: filterAttributes,
    attributeTerms,
    filterConfig,
  };
}
