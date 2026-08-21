import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

export const CategoryPageSkeleton = () => {
  return (
    <div className="bg-white min-h-screen">
      <ScrollToTop />
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Loading...' }]} />

      <Container className="py-8">
        {/* Filters Skeleton */}
        <div className="h-20 bg-gray-100 animate-pulse rounded mb-8 border border-gray-200" />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-8">
          <div className="lg:w-1/3 flex-shrink-0">
            {/* Title Skeleton */}
            <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded mb-4" />
            
            {/* Description Skeleton */}
            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-4/6 bg-gray-100 animate-pulse rounded" />
            </div>
          </div>
          
          <div className="lg:w-2/3">
            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 bg-white">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="aspect-square w-full bg-gray-100 animate-pulse rounded mb-4" />
                  <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
                  <div className="h-4 w-full bg-gray-100 animate-pulse rounded mb-1" />
                  <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded mb-3" />
                  <div className="h-5 w-1/4 bg-gray-200 animate-pulse rounded mt-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};
