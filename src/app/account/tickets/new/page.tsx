import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { getCustomerOrders } from '@/features/account/services/orders';
import { RaiseTicketForm } from '@/features/account/components/tickets/RaiseTicketForm';
import { getSEOMetadata } from '@/lib/seo';

export const metadata = getSEOMetadata('/account/tickets/new', {
  title: 'Raise a Support Ticket | Abbeygate England',
  noindex: true,
});

type NewTicketPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function NewTicketPage({ searchParams }: NewTicketPageProps) {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const { orderId } = await searchParams;
  const orders = await getCustomerOrders(session.userId);

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb
        paths={[
          { label: 'Home', href: '/' },
          { label: 'My Account', href: '/account' },
          { label: 'Support Tickets', href: '/account/tickets' },
          { label: 'Raise a Ticket' },
        ]}
      />

      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            <RaiseTicketForm orders={orders} initialOrderId={orderId} />
          </div>
        </div>
      </Container>
    </main>
  );
}
