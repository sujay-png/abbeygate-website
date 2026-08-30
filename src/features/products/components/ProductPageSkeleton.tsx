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
                  <div key={i} className="h-20 w-20 lg:h-24 lg:w-24 bg-gray-200 animate-pulse rounded-lg border-2 border-gray-100 flex-shrink-0" style={{ backgroundColor: '#f9f9f9' }} />
                ))}
              </div>
              
              {/* Main Image */}
              <div className="relative w-full max-w-[650px] mx-auto flex-1 aspect-[4/5] bg-[#ebe4d3] animate-pulse rounded-xl border border-gray-100 order-1 md:order-2" />
            </div>
          </div>
          
          {/* Details Skeleton */}
          <div className="flex flex-col gap-4 w-full lg:max-w-xl">
            {/* Title Block */}
            <div>
              <div className="h-4 w-32 bg-brand-primary/20 animate-pulse rounded mb-4" /> {/* Collection */}
              <div className="h-10 w-4/5 bg-gray-300 animate-pulse rounded mb-4" /> {/* H1 */}
              
              <div className="space-y-3 mb-4"> {/* Description */}
                <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-4/6 bg-gray-200 animate-pulse rounded" />
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-1">
              <div className="h-8 w-24 bg-gray-300 animate-pulse rounded" />
              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
            </div>
            
            {/* SKU */}
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2" />

            {/* Description Accordion */}
            <div className="h-[54px] w-full bg-white border border-gray-200 rounded-lg animate-pulse mb-2" />

            {/* Color Swatches */}
            <div className="mb-2">
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-3" />
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 animate-pulse border border-gray-300 shadow-sm" />
                ))}
              </div>
            </div>
            
            <hr className="border-gray-200" />

            {/* Quantity & Actions */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex justify-between items-start">
                <div className="h-5 w-20 bg-gray-200 animate-pulse rounded mt-2" />
                <div className="flex flex-col items-end gap-2">
                  <div className="h-9 w-24 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 w-32 bg-gray-100 animate-pulse rounded mt-1" />
                </div>
              </div>
              
              {/* No customisation required */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3 animate-pulse">
                 <div className="w-4 h-4 bg-gray-200 rounded mt-1 shrink-0" />
                 <div className="flex-1">
                   <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                   <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                   <div className="h-3 w-4/5 bg-gray-100 rounded" />
                 </div>
              </div>
              
              {/* Savings Box */}
              <div className="bg-[#e9f2f2] rounded-lg px-5 py-5 border border-[#c2dede] animate-pulse">
                <div className="h-5 w-48 bg-[#c2dede] rounded mb-2" />
                <div className="h-4 w-full bg-[#d0e5e5] rounded mb-4" />
                <div className="h-10 w-full bg-white/50 border border-[#c2dede] rounded-md" />
              </div>
              
              {/* Action Button */}
              <div className="h-12 w-full bg-brand-primary/20 animate-pulse rounded-lg mt-2 mb-2" />
            </div>

            {/* Specifications & Delivery Accordions */}
            <div className="h-[54px] w-full bg-white border border-gray-200 rounded-lg animate-pulse mt-2 mb-2" />
            <div className="h-[54px] w-full bg-white border border-gray-200 rounded-lg animate-pulse mb-2" />
          </div>
        </div>
      </Container>
    </div>
  );
};
