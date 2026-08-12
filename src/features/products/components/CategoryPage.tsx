import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { CategoryPageContent } from '@/features/products/components/CategoryPageContent';
import { loadCategoryPageData } from '@/features/products/services/category-page';

type CategoryPageProps = {
  path: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function CategoryPage({ path, searchParams }: CategoryPageProps) {
  const params = await searchParams;
  const data = await loadCategoryPageData(path, params);

  if (!data) notFound();

  return (
    <Suspense fallback={<div className="py-20 text-center">Loading products...</div>}>
      <CategoryPageContent {...data} />
    </Suspense>
  );
}
