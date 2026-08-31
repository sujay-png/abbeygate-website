import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { BulkOrderForm } from '@/features/account/components/BulkOrderForm';
import { getPurchaseLists } from '@/features/account/services/purchase-lists';

export const metadata = {
  title: 'Bulk Order | Abbeygate',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BulkOrderPage({ searchParams }: Props) {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const resolvedSearchParams = await searchParams;
  const listId = resolvedSearchParams.list as string | undefined;

  let initialRows = undefined;
  
  if (listId) {
    const lists = await getPurchaseLists();
    const list = lists.find(l => l.id === listId);
    if (list) {
      initialRows = list.items.map(item => ({
        id: Math.random().toString(36).substring(2, 9),
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        price: item.price,
        qty: item.qty,
        image: item.image || ''
      }));
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account/dashboard' }, { label: 'Bulk order' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
          <AccountSidebar />
          
          <div className="flex-1 w-full">
            <h2 className="text-[26px] font-normal text-gray-800 mb-6">Quick / Bulk Order Form</h2>
            
            <div className="bg-white border border-gray-200/80 rounded-sm">
              <BulkOrderForm initialRows={initialRows} />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
