import { CategoryPage } from '@/features/products/components/CategoryPage';
import { getStaticCategoryParams } from '@/data/category-routes';
import { generateCategoryMetadata } from '@/lib/seo';

export const revalidate = 3600;

export function generateStaticParams() {
  return getStaticCategoryParams('/diaries');
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCategoryMetadata('/diaries', slug);
}

export default async function DiariesPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/diaries/${slug.join('/')}` : '/diaries';
  return <CategoryPage path={path} />;
}
