import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

export const ProductPageSkeleton = () => {
  return (
    <div className="bg-white min-h-screen">
      <ScrollToTop />
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Loading...' }]} />
      <Container className="py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Gallery Skeleton */}
          <div className="lg:w-1/2 flex flex-col gap-4">
            <div className="aspect-square w-full bg-gray-100 animate-pulse rounded-lg" />
            <div className="flex gap-4 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-gray-100 animate-pulse rounded flex-shrink-0" />
              ))}
            </div>
          </div>
          
          {/* Details Skeleton */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="h-8 w-1/4 bg-gray-200 animate-pulse rounded mb-4" />
            <div className="h-12 w-3/4 bg-gray-200 animate-pulse rounded mb-6" />
            
            <div className="space-y-4 mb-8">
              <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-4/6 bg-gray-100 animate-pulse rounded" />
            </div>

            <div className="h-10 w-1/3 bg-gray-200 animate-pulse rounded mb-8" />
            
            <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-lg border border-gray-100" />
          </div>
        </div>
      </Container>
    </div>
  );
};
