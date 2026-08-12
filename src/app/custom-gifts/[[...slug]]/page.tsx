import { CategoryPage } from '@/features/products/components/CategoryPage';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomGiftsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/custom-gifts/${slug.join('/')}` : '/custom-gifts';
  return <CategoryPage path={path} searchParams={searchParams} />;
}
