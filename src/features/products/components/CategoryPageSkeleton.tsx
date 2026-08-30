import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

export const CategoryPageSkeleton = () => {
  return (
    <div className="bg-white min-h-screen">
      <ScrollToTop />
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Loading...' }]} />

      <Container className="py-8">
        {/* Matches the full-width filter bar in the loaded category page. */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-20 bg-gray-100 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-y border-gray-200">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[68px] border-r border-gray-200 last:border-r-0 p-5">
                <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-8">
          <div className="lg:w-1/3 flex-shrink-0 mb-10 lg:mb-0">
            <div className="h-10 w-1/2 bg-gray-200 animate-pulse rounded mb-5" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded" />
            </div>
          </div>

          <div className="lg:w-2/3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col">
                  <div className="aspect-square w-full bg-[#f5f5f5] animate-pulse mb-4" />
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
