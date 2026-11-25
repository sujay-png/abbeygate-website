import { CategoryPage } from '@/features/products/components/CategoryPage';
import { getStaticCategoryParams } from '@/data/category-routes';
import { generateCategoryMetadata } from '@/lib/seo';

export const revalidate = 3600;

export function generateStaticParams() {
  return getStaticCategoryParams('/notebooks');
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCategoryMetadata('/notebooks', slug);
}

export default async function NotebooksPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/notebooks/${slug.join('/')}` : '/notebooks';
  return <CategoryPage path={path} />;
}
