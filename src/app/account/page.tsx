import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AuthForms } from '@/features/auth/components/AuthForms';

export default async function AccountPage() {
  const session = await getSession();

  // If the user is already logged in, redirect them directly to the dashboard!
  if (session) {
    redirect('/account/dashboard');
  }

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-primary-dark font-sans tracking-tight mb-8 md:mb-12">
          My Account
        </h1>

        <AuthForms />
        
      </Container>
    </main>
  );
}
