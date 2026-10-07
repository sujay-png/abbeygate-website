import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CategoryPageContent } from '@/features/products/components/CategoryPageContent';
import { loadCategoryPageData } from '@/features/products/services/category-page';

type CategoryPageProps = {
  path: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function CategoryPage({ path, searchParams }: CategoryPageProps) {
  // Filters are applied client-side, but awaiting searchParams keeps this route dynamically
  // rendered so the product grid stays in the server HTML (useSearchParams on a static
  // route would bail the grid out to client-only rendering, hurting SEO).
  await searchParams;
  const data = await loadCategoryPageData(path);

  if (!data) notFound();

  return (
    <Suspense fallback={<div className="py-20 text-center">Loading products...</div>}>
      <CategoryPageContent {...data} />
    </Suspense>
  );
}
