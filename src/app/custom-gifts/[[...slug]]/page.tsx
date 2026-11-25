import { CategoryPage } from '@/features/products/components/CategoryPage';
import { getStaticCategoryParams } from '@/data/category-routes';
import { generateCategoryMetadata } from '@/lib/seo';

export const revalidate = 3600;

export function generateStaticParams() {
  return getStaticCategoryParams('/custom-gifts');
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCategoryMetadata('/custom-gifts', slug);
}

export default async function CustomGiftsPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/custom-gifts/${slug.join('/')}` : '/custom-gifts';
  return <CategoryPage path={path} />;
}
