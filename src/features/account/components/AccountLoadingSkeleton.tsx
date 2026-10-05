import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';

export function AccountLoadingSkeleton({ breadcrumbLabel }: { breadcrumbLabel?: string }) {
  const paths = [{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account' }];
  if (breadcrumbLabel && breadcrumbLabel !== 'My Account') {
    paths.push({ label: breadcrumbLabel, href: '#' });
  }

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={paths} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />
          
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8 min-h-[400px]">
            {/* Header Skeleton */}
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8 animate-pulse" />
            
            {/* Content Lines Skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            </div>

            {/* Block Skeleton (e.g. for a table or large card) */}
            <div className="mt-8 h-48 bg-gray-100/80 rounded-lg w-full animate-pulse border border-gray-200/50" />
          </div>
        </div>
      </Container>
    </main>
  );
}
