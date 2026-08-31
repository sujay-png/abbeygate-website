import { getSession } from '@/features/auth/utils/session';
import { logoutCustomer } from '@/features/auth/services/login';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';

export default async function DashboardPage() {
  const session = await getSession();

  // If the user isn't logged in, redirect them to the login page
  if (!session) {
    redirect('/account');
  }

  // Determine user display name
  const username = session.email.split('@')[0];

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <AccountSidebar />

          {/* Main Content Area */}
          <div className="flex-1 w-full bg-white border border-gray-200/80 rounded-lg p-6 md:p-8">
            <div className="text-gray-700 leading-relaxed mb-4">
              Hello <strong className="font-semibold">{username}</strong> (not {username}?{' '}
              <form action={logoutCustomer} className="inline">
                <button type="submit" className="text-brand-primary hover:underline hover:text-brand-primary-dark cursor-pointer p-0 bg-transparent border-0 inline">
                  Log out
                </button>
              </form>
              )
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              From your account dashboard you can view your <a href="#" className="text-brand-primary hover:underline transition-colors">recent orders</a>, manage your <a href="#" className="text-brand-primary hover:underline transition-colors">shipping and billing addresses</a>, and <a href="#" className="text-brand-primary hover:underline transition-colors">edit your password and account details</a>.
            </p>
          </div>
          
        </div>
      </Container>
    </main>
  );
}
