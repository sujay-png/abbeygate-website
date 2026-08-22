import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

export const ProductPageSkeleton = () => {
  return (
    <div className="bg-brand-cream min-h-screen">
      <ScrollToTop />
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Loading...' }]} />
      <Container className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:items-start">
          {/* Gallery Skeleton */}
          <div className="relative z-10 self-start flex flex-col gap-8 w-full scroll-mt-[120px] lg:sticky lg:top-[120px]">
            <div className="flex flex-col md:flex-row gap-4 lg:gap-6 w-full">
              {/* Thumbnails */}
              <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:max-h-[600px] pb-2 md:pb-0 shrink-0 order-2 md:order-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 w-20 lg:h-24 lg:w-24 bg-gray-200 animate-pulse rounded-lg border-2 border-gray-100 flex-shrink-0" />
                ))}
              </div>
              
              {/* Main Image */}
              <div className="relative w-full max-w-[500px] mx-auto flex-1 aspect-[4/5] bg-gray-100 animate-pulse rounded-xl border border-gray-100 order-1 md:order-2" />
            </div>
          </div>
          
          {/* Details Skeleton */}
          <div className="flex flex-col gap-8 w-full lg:max-w-xl">
            {/* Title Block */}
            <div>
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-4" /> {/* Collection */}
              <div className="h-10 w-4/5 bg-gray-300 animate-pulse rounded mb-6" /> {/* H1 */}
              
              <div className="space-y-3 mb-2"> {/* Description */}
                <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-4/6 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <div className="h-8 w-24 bg-gray-300 animate-pulse rounded" />
              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
            </div>

            {/* Accordion / Description Card */}
            <div className="h-[60px] w-full bg-gray-50 border border-gray-200 rounded-lg animate-pulse" />

            {/* Color Swatches */}
            <div className="mt-2 mb-2">
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-3" />
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Quantity Box */}
            <div className="bg-transparent border border-gray-200 rounded-lg px-4 py-4 flex flex-col gap-3 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="h-4 w-20 bg-gray-200 rounded mt-1" />
                <div className="h-9 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-40 bg-gray-100 rounded mt-1" />
            </div>

            {/* Price Breaks Table */}
            <div className="w-full text-[13px] border border-gray-200 rounded-lg bg-white overflow-hidden animate-pulse">
              <div className="bg-gray-50 px-4 py-3 flex justify-between border-b border-gray-200">
                <div className="h-3 w-20 bg-gray-300 rounded" />
                <div className="h-3 w-20 bg-gray-300 rounded" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 flex justify-between border-b border-gray-100 last:border-0">
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
            
            {/* Customization Button */}
            <div className="h-[50px] w-full bg-gray-300 animate-pulse rounded-lg mt-2" />
          </div>
        </div>
      </Container>
    </div>
  );
};
