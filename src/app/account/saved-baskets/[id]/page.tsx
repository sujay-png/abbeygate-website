import { getSession } from '@/features/auth/utils/session';
import { redirect, notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { getsavedBaskets } from '@/features/account/services/saved-baskets';
import { SavedBasketDetailClient } from '@/features/account/components/SavedBasketDetailClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Saved Basket | Abbeygate',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SavedBasketPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const lists = await getsavedBaskets();
  const basket = lists.find(list => list.id === id);

  if (!basket) {
    notFound();
  }

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[
        { label: 'Home', href: '/' },
        { label: 'My Account', href: '/account/dashboard' },
        { label: 'Saved Baskets', href: '/account/saved-baskets' },
        { label: basket.name }
      ]} />
      
      <Container className="py-8 md:py-12 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          <AccountSidebar />
          
          <div className="flex-1 bg-white rounded-lg border border-gray-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
              <div className="flex flex-col gap-2">
                <Link href="/account/saved-baskets" className="text-sm text-brand-primary font-medium inline-flex items-center gap-1 hover:underline">
                  <ArrowLeft size={16} /> Back to Saved Baskets
                </Link>
                <h2 className="text-2xl font-bold text-brand-primary-dark">
                  {basket.name}
                </h2>
              </div>
            </div>

            <SavedBasketDetailClient basket={basket} />
          </div>
        </div>
      </Container>
    </main>
  );
}
