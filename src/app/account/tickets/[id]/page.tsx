import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { getTicketDetail } from '@/features/account/services/tickets';
import { TicketDetailClient } from '@/features/account/components/tickets/TicketDetailClient';
import { getSEOMetadata } from '@/lib/seo';

export const metadata = getSEOMetadata('/account/tickets/[id]', {
  title: 'Ticket Details | Abbeygate England',
  noindex: true,
});

type TicketDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const { id } = await params;
  const ticket = await getTicketDetail(id, session.userId);

  if (!ticket) {
    redirect('/account/tickets');
  }

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb
        paths={[
          { label: 'Home', href: '/' },
          { label: 'My Account', href: '/account' },
          { label: 'Support Tickets', href: '/account/tickets' },
          { label: `#${ticket.ticket_number}` },
        ]}
      />

      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            <TicketDetailClient ticket={ticket} />
          </div>
        </div>
      </Container>
    </main>
  );
}
