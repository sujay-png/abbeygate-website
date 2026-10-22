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
export function getProductBreadcrumbs(product: StoreProduct): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];

  if (product.categories && product.categories.length > 0) {
    // 1. Find all predefined routes that match any of the product's assigned categories
    const matchedRoutes = product.categories
      .map(cat => CATEGORY_ROUTES.find(r => r.categoryId === cat.id || String(r.categoryId).split(',').includes(String(cat.id))))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);

    if (matchedRoutes.length > 0) {
      // 2. Separate standard hierarchical routes (/diaries, /notebooks, /custom-gifts) from flat collections (/collection)
      const standardRoutes = matchedRoutes.filter(
        r => !r.path.startsWith('/collection') && !r.path.startsWith('/category')
      );

      // 3. Pick the deepest candidate route to represent the leaf category
      const candidateRoutes = standardRoutes.length > 0 ? standardRoutes : matchedRoutes;
      const deepestRoute = candidateRoutes.reduce((prev, curr) => {
        const prevDepth = prev.path.split('/').filter(Boolean).length;
        const currDepth = curr.path.split('/').filter(Boolean).length;
        return currDepth > prevDepth ? curr : prev;
      });

      // 4. Decompose deepest route into its complete ancestor hierarchy
      // e.g. path "/diaries/a5" -> ['/diaries', '/diaries/a5']
      const segments = deepestRoute.path.split('/').filter(Boolean);
      segments.forEach((_, idx) => {
        const subPath = '/' + segments.slice(0, idx + 1).join('/');
        const matchingRoute = CATEGORY_ROUTES.find(r => r.path === subPath);
        
        const label = matchingRoute
          ? cleanCategoryTitle(matchingRoute.title)
          : slugToTitle(segments[idx]);

        breadcrumbs.push({ label, href: subPath });
      });
    } else {
      // Fallback if none of the categories map to a defined route
      breadcrumbs.push({ label: 'Products', href: '/notebooks' });
    }
  } else {
    // Fallback if product has no categories
    breadcrumbs.push({ label: 'Products', href: '/notebooks' });
  }

  // Final destination: Current product name (not clickable)
  breadcrumbs.push({ label: product.name });

  return breadcrumbs;
}
