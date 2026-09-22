import { getCategoryRoute, getFilterConfigForPath } from '@/data/category-routes';
import { getAllStoreProductsByCategory, getStoreCategoryById } from '../services/store-products';
import { parseFiltersFromSearchParams } from '../utils/product-helpers';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';
import { getFilterDataForProducts } from './filter-helpers';

export async function loadCategoryPageData(path: string, searchParams: Record<string, string | string[] | undefined>) {
  const route = getCategoryRoute(path);

  if (!route) {
    return null;
  }

  let allProducts: StoreProduct[] = [];
  let filterAttributes: StoreAttribute[] = [];
  let attributeTerms: Record<number, StoreAttributeTerm[]> = {};
  let wooCategory = null;

  try {
    if (typeof route.categoryId === 'number' || !String(route.categoryId).includes(',')) {
      wooCategory = await getStoreCategoryById(Number(route.categoryId));
    }
  } catch (error) {
    console.warn(`Failed to load WooCommerce category ${route.categoryId}:`, error);
  }

  try {
    const rawProducts = await getAllStoreProductsByCategory(route.categoryId);
    const filterData = await getFilterDataForProducts(rawProducts);
    
    allProducts = filterData.allProducts;
    filterAttributes = filterData.filterAttributes;
    attributeTerms = filterData.attributeTerms;
    
  } catch (error) {
    console.error(`Failed to load products for category ${route.categoryId}:`, error);
    throw error;
  }

  const filters = parseFiltersFromSearchParams(searchParams);
  const sort = typeof searchParams?.sort === 'string' ? searchParams.sort : 'date-new';
  const baseFilterConfig = getFilterConfigForPath(path);
  const filterConfig = {
    ...baseFilterConfig,
    ...(route.filterConfig || {})
  };

  const pathParts = path.split('/').filter(Boolean);
  const breadcrumbItems = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const label = part
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return index === pathParts.length - 1
      ? { label: wooCategory?.name || route.title }
      : { label, href };
  });

  let description = wooCategory?.description || route.description || '';
  if (description && !description.includes('<p>') && !description.includes('<h')) {
    // WordPress often returns raw text with \r\n for category descriptions
    description = description
      .split(/\r?\n\r?\n/)
      .map((p: string) => `<p class="mb-4">${p.trim()}</p>`)
      .join('');
  }

  return {
    title: wooCategory?.name || route.title,
    description,
    breadcrumbItems,
    allProducts,
    filters,
    attributes: filterAttributes,
    attributeTerms,
    filterConfig,
    sort,
  };
}
