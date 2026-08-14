import { CategoryPage } from '@/features/products/components/CategoryPage';

import { generateCategoryMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCategoryMetadata('/custom-gifts', slug);
}

export default async function CustomGiftsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/custom-gifts/${slug.join('/')}` : '/custom-gifts';
  return <CategoryPage path={path} searchParams={searchParams} />;
}
