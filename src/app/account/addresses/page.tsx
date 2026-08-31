import { getSession } from '@/features/auth/utils/session';
import { redirect } from 'next/navigation';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { AccountSidebar } from '@/features/account/components/AccountSidebar';
import { AddressOverview } from '@/features/account/components/AddressOverview';
import { AddressForm } from '@/features/account/components/AddressForm';
import { getAddresses } from '@/features/account/services/address';

export const metadata = {
  title: 'Addresses | Abbeygate',
};

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AddressesPage({ searchParams }: Props) {
  const session = await getSession();

  if (!session) {
    redirect('/account');
  }

  const resolvedSearchParams = await searchParams;
  const editMode = resolvedSearchParams.edit as string | undefined;

  const addresses = await getAddresses();

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account/dashboard' }, { label: 'Addresses' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <div className="mx-auto w-full">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16">
            <AccountSidebar />
            
            <div className="flex-1 w-full max-w-4xl">
              {!editMode && (
                <AddressOverview addresses={addresses} />
              )}
              
              {editMode === 'billing' && (
                <div>
                  <h2 className="text-[28px] font-medium text-black mb-8">Billing address</h2>
                  <AddressForm 
                    type="billing" 
                    initialData={addresses?.billing || null} 
                  />
                </div>
              )}

              {editMode === 'shipping' && (
                <div>
                  <h2 className="text-[28px] font-medium text-black mb-8">Shipping address</h2>
                  <AddressForm 
                    type="shipping" 
                    initialData={addresses?.shipping || null} 
                    billingData={addresses?.billing || null}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
