import { CATEGORY_ROUTES } from '@/data/category-routes';
import type { StoreProduct } from '../types/store-product';
import type { BreadcrumbItem } from '@/components/content/Breadcrumb';

/**
 * Normalises a category route title for use in breadcrumbs
 * e.g., "All Diaries" -> "Diaries"
 */
function cleanCategoryTitle(title: string): string {
  return title.replace(/^All\s+/i, '').trim();
}

/**
 * Converts a URL slug into readable Title Case
 * e.g., "passport-wallets" -> "Passport Wallets"
 */
function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Builds canonical, hierarchical breadcrumbs for a product based on its category taxonomy.
 * This guarantees a deterministic path (e.g. Home > Diaries > A5 Diaries > Product Name)
 * regardless of the user's browsing route.
 *
 * The final product item is intentionally created without an `href` so it remains
 * unclickable text in compliance with standard UX guidelines.
 */
const NON_COLLECTION_PREFIXES = new Set(['diaries', 'notebooks', 'custom-gifts', 'best-sellers']);

function isHierarchicalCategoryRoute(path: string): boolean {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return false;
  if (parts[0] === 'collection') {
    return parts.length > 1 && NON_COLLECTION_PREFIXES.has(parts[1]) && parts[1] !== 'best-sellers';
  }
  return parts[0] !== 'category';
}

export function getProductBreadcrumbs(product: StoreProduct): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  if (product.categories && product.categories.length > 0) {
    // 1. Find all predefined routes that match any of the product's assigned categories
    const matchedRoutes = product.categories
      .flatMap((cat) =>
        CATEGORY_ROUTES.filter(
          (r) =>
            r.categoryId === cat.id ||
            String(r.categoryId).split(',').map((s) => s.trim()).includes(String(cat.id))
        )
      )
      .filter((route, idx, arr) => arr.findIndex((r) => r.path === route.path) === idx);

    if (matchedRoutes.length > 0) {
      // 2. Separate standard hierarchical routes (/collection/diaries, /collection/notebooks, /collection/custom-gifts)
      //    from named collections (/collection/chelsea, etc.) and Best Sellers.
      const standardRoutes = matchedRoutes.filter((r) => isHierarchicalCategoryRoute(r.path));
      const namedCollectionRoutes = matchedRoutes.filter((r) => r.path !== '/collection/best-sellers');

      // 3. Pick the deepest candidate route (preferring canonical /collection/... URLs over legacy redirects)
      const candidateRoutes =
        standardRoutes.length > 0
          ? standardRoutes
          : namedCollectionRoutes.length > 0
            ? namedCollectionRoutes
            : matchedRoutes;

      const deepestRoute = candidateRoutes.reduce((prev, curr) => {
        const prevParts = prev.path.split('/').filter(Boolean);
        const currParts = curr.path.split('/').filter(Boolean);
        const prevDepth = prevParts[0] === 'collection' && NON_COLLECTION_PREFIXES.has(prevParts[1])
          ? prevParts.length - 1
          : prevParts.length;
        const currDepth = currParts[0] === 'collection' && NON_COLLECTION_PREFIXES.has(currParts[1])
          ? currParts.length - 1
          : currParts.length;
        if (currDepth !== prevDepth) return currDepth > prevDepth ? curr : prev;
        // Prefer canonical /collection/... route on depth tie
        if (curr.path.startsWith('/collection/') && !prev.path.startsWith('/collection/')) return curr;
        return prev;
      });

      // 4. Decompose deepest route into its ancestor hierarchy.
      //    Strip the leading `/collection` GA4 grouping prefix for diaries/notebooks/custom-gifts
      //    so breadcrumbs read `Home > Diaries > A5 Diaries` instead of `Home > Our Collections > Diaries > A5 Diaries`.
      const segments = deepestRoute.path.split('/').filter(Boolean);
      const skipCollectionPrefix =
        segments[0] === 'collection' && segments.length > 1 && NON_COLLECTION_PREFIXES.has(segments[1]);

      segments.forEach((_, idx) => {
        if (skipCollectionPrefix && idx === 0) return;
        const subPath = '/' + segments.slice(0, idx + 1).join('/');
        const matchingRoute = CATEGORY_ROUTES.find((r) => r.path === subPath);

        const label = matchingRoute
          ? cleanCategoryTitle(matchingRoute.title)
          : slugToTitle(segments[idx]);

        breadcrumbs.push({ label, href: subPath });
      });
    } else {
      // Fallback if none of the categories map to a defined route
      breadcrumbs.push({ label: 'Products', href: '/collection/notebooks' });
    }
  } else {
    // Fallback if product has no categories
    breadcrumbs.push({ label: 'Products', href: '/collection/notebooks' });
  }

  // Final destination: Current product name (not clickable)
  breadcrumbs.push({ label: product.name });

  return breadcrumbs;
}
