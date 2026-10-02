import { CheckoutClient } from '@/features/checkout/components/CheckoutClient';
import { getSession } from '@/features/auth/utils/session';
import { getAccountDetails } from '@/features/account/services/customer';
import { getAddresses } from '@/features/account/services/address';

export default async function CheckoutPage() {
  const session = await getSession();
  let initialDetails: any = undefined;

  if (session) {
    const [account, addresses] = await Promise.all([
      getAccountDetails(session.userId),
      getAddresses()
    ]);

    if (account || addresses) {
      initialDetails = {
        email: account?.email || session.email || '',
        shipping: {
          firstName: addresses?.shipping?.first_name || account?.first_name || '',
          lastName: addresses?.shipping?.last_name || account?.last_name || '',
          company: addresses?.shipping?.company || '',
          address1: addresses?.shipping?.address_1 || '',
          address2: addresses?.shipping?.address_2 || '',
          city: addresses?.shipping?.city || '',
          postcode: addresses?.shipping?.postcode || '',
          phone: addresses?.shipping?.phone || '',
        },
        billing: {
          firstName: addresses?.billing?.first_name || account?.first_name || '',
          lastName: addresses?.billing?.last_name || account?.last_name || '',
          company: addresses?.billing?.company || '',
          address1: addresses?.billing?.address_1 || '',
          address2: addresses?.billing?.address_2 || '',
          city: addresses?.billing?.city || '',
          postcode: addresses?.billing?.postcode || '',
          phone: addresses?.billing?.phone || '',
        }
      };
    }
  }

  return <CheckoutClient initialDetails={initialDetails} isLoggedIn={!!session} />;
}
