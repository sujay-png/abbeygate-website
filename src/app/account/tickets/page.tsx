import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { getCustomerTickets } from '@/features/account/services/tickets';
import { TicketsList } from '@/features/account/components/tickets/TicketsList';
import { getSEOMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = getSEOMetadata('/account/tickets', {
  title: 'Support Tickets | Abbeygate England',
  noindex: true,
});

export default async function TicketsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const tickets = await getCustomerTickets(session.userId);

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb
        paths={[
          { label: 'Home', href: '/' },
          { label: 'My Account', href: '/account' },
          { label: 'Support Tickets' },
        ]}
      />

      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            <TicketsList tickets={tickets} />
          </div>
        </div>
      </Container>
    </main>
  );
}
