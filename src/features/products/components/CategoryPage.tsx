import { notFound } from 'next/navigation';
import { CategoryPageContent } from '@/features/products/components/CategoryPageContent';
import { loadCategoryPageData } from '@/features/products/services/category-page';

type CategoryPageProps = {
  path: string;
};

export async function CategoryPage({ path }: CategoryPageProps) {
  const data = await loadCategoryPageData(path);

  if (!data) notFound();

  return <CategoryPageContent {...data} />;
}
