import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { AccountDetailsForm } from '@/features/account/components/AccountDetailsForm';
import { getAccountDetails } from '@/features/account/services/customer';

export const metadata = {
  title: 'Account Details | Abbeygate',
};

export default async function AccountDetailsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const accountDetails = await getAccountDetails(session.userId);

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account/dashboard' }, { label: 'Account Details' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="mx-auto w-full">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
            <AccountSidebar />
            
            <div className="flex-1 w-full max-w-3xl">
              <h2 className="text-2xl font-semibold text-brand-primary-dark mb-6">Account Details</h2>
              <AccountDetailsForm initialData={accountDetails} />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
