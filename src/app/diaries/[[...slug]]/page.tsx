import { CategoryPage } from '@/features/products/components/CategoryPage';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiariesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/diaries/${slug.join('/')}` : '/diaries';
  return <CategoryPage path={path} searchParams={searchParams} />;
}
