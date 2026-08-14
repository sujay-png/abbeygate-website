import { CategoryPage } from '@/features/products/components/CategoryPage';

import { generateCategoryMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCategoryMetadata('/notebooks', slug);
}

export default async function NotebooksPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/notebooks/${slug.join('/')}` : '/notebooks';
  return <CategoryPage path={path} searchParams={searchParams} />;
}
