import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { getsavedBaskets } from '@/features/account/services/saved-baskets';
import Link from 'next/link';
import { SavedBasketsClient } from '@/features/account/components/SavedBasketsClient';

export const metadata = {
  title: 'Saved Baskets | Abbeygate',
};

export default async function savedBasketsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const lists = await getsavedBaskets();

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account/dashboard' }, { label: 'Saved Baskets' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          <AccountSidebar />
          
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-brand-primary-dark">Saved Baskets</h2>
              <Link 
                href="/account/bulk-order"
                className="bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                New List
              </Link>
            </div>

            <SavedBasketsClient initialLists={lists} />
          </div>
        </div>
      </Container>
    </main>
  );
}
