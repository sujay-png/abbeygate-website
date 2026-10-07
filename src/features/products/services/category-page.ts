import { getCategoryRoute, getFilterConfigForPath } from '@/data/category-routes';
import { getAllStoreProductsByCategory, getStoreCategoryById } from '../services/store-products';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';
import { getFilterDataForProducts, preloadFilterAttributes, toListingProduct } from './filter-helpers';

export async function loadCategoryPageData(path: string) {
  const route = getCategoryRoute(path);

  if (!route) {
    return null;
  }

  let allProducts: StoreProduct[] = [];
  let filterAttributes: StoreAttribute[] = [];
  let attributeTerms: Record<number, StoreAttributeTerm[]> = {};

  // Fire the independent WooCommerce requests together instead of one after another.
  preloadFilterAttributes();
  const categoryPromise =
    typeof route.categoryId === 'number' || !String(route.categoryId).includes(',')
      ? getStoreCategoryById(Number(route.categoryId))
      : Promise.resolve(null);

  try {
    const rawProducts = await getAllStoreProductsByCategory(route.categoryId);
    const filterData = await getFilterDataForProducts(rawProducts);
    
    allProducts = filterData.allProducts.map(toListingProduct);
    filterAttributes = filterData.filterAttributes;
    attributeTerms = filterData.attributeTerms;
    
  } catch (error) {
    console.error(`Failed to load products for category ${route.categoryId}:`, error);
    throw error;
  }

  const wooCategory = await categoryPromise;

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
      ? { label: route.title || wooCategory?.name || label }
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
    title: route.title || wooCategory?.name || '',
    description,
    breadcrumbItems,
    allProducts,
    attributes: filterAttributes,
    attributeTerms,
    filterConfig,
  };
}
