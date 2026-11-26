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
  const categoryIdsToCheck = route.primaryCategoryId
    ? Array.from(
        new Set([
          route.primaryCategoryId,
          ...String(route.categoryId)
            .split(',')
            .map((id) => Number(id.trim()))
            .filter((id) => Number.isFinite(id) && id > 0),
        ]),
      )
    : typeof route.categoryId === 'number' || !String(route.categoryId).includes(',')
      ? [Number(route.categoryId)]
      : [];

  const categoryPromise = (async () => {
    if (categoryIdsToCheck.length === 0) return null;
    const cats = await Promise.all(categoryIdsToCheck.map((id) => getStoreCategoryById(id)));
    return cats.find((c) => c?.description?.trim()) || cats.find(Boolean) || null;
  })();

  try {
    let rawProducts = await getAllStoreProductsByCategory(route.categoryId);
    if (rawProducts.length === 0 && route.fallbackExcludeCategoryIds) {
      const { parentCategoryId, excludeCategoryIds } = route.fallbackExcludeCategoryIds;
      const excludeSet = new Set(excludeCategoryIds);
      const parentProducts = await getAllStoreProductsByCategory(parentCategoryId);
      rawProducts = parentProducts.filter(
        (p) => !p.categories?.some((c) => excludeSet.has(c.id)),
      );
    }
    const filterData = await getFilterDataForProducts(rawProducts);
    
    allProducts = filterData.allProducts.map(toListingProduct);
    filterAttributes = filterData.filterAttributes;
    attributeTerms = filterData.attributeTerms;
    
  } catch (error) {
    console.error(`Failed to load products for category ${route.categoryId}:`, error);
    allProducts = [];
    filterAttributes = [];
    attributeTerms = {};
  }

  const wooCategory = await categoryPromise;

  const baseFilterConfig = getFilterConfigForPath(path);
  const filterConfig = {
    ...baseFilterConfig,
    ...(route.filterConfig || {})
  };

  const pathParts = path.split('/').filter(Boolean);
  const skipCollectionPrefix =
    pathParts[0] === 'collection' &&
    pathParts.length > 1 &&
    ['diaries', 'notebooks', 'custom-gifts', 'best-sellers'].includes(pathParts[1]);

  const breadcrumbItems = pathParts
    .map((part, index) => {
      if (skipCollectionPrefix && index === 0) return null;
      const href = '/' + pathParts.slice(0, index + 1).join('/');
      const matchingRoute = getCategoryRoute(href);
      const label = matchingRoute
        ? matchingRoute.title.replace(/^All\s+/i, '')
        : part
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

      return index === pathParts.length - 1
        ? { label: matchingRoute?.title ? matchingRoute.title.replace(/^All\s+/i, '') : (wooCategory?.name || label) }
        : { label, href };
    })
    .filter((item): item is { label: string; href?: string } => item !== null);

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
