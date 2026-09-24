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
        firstName: account?.first_name || addresses?.shipping?.first_name || addresses?.billing?.first_name || '',
        lastName: account?.last_name || addresses?.shipping?.last_name || addresses?.billing?.last_name || '',
        company: addresses?.shipping?.company || addresses?.billing?.company || '',
        address1: addresses?.shipping?.address_1 || addresses?.billing?.address_1 || '',
        address2: addresses?.shipping?.address_2 || addresses?.billing?.address_2 || '',
        city: addresses?.shipping?.city || addresses?.billing?.city || '',
        postcode: addresses?.shipping?.postcode || addresses?.billing?.postcode || '',
        phone: addresses?.shipping?.phone || addresses?.billing?.phone || '',
      };
    }
  }

  return <CheckoutClient initialDetails={initialDetails} />;
}
