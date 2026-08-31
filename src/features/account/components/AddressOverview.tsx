import Link from 'next/link';
import { CustomerAddresses, Address } from '@/features/account/services/address';

type Props = {
  addresses: CustomerAddresses | null;
};

function formatAddress(address: Address | undefined) {
  // Simple heuristic to check if address exists
  if (!address || (!address.first_name && !address.address_1)) return null;
  
  const parts = [
    `${address.first_name} ${address.last_name}`.trim(),
    address.company,
    address.address_1,
    address.address_2,
    [address.city, address.state].filter(Boolean).join(', '),
    address.postcode,
    address.country
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <address className="not-italic text-[14px] text-gray-600 leading-relaxed mt-4">
      {parts.map((part, index) => (
        <div key={index}>{part}</div>
      ))}
    </address>
  );
}

export function AddressOverview({ addresses }: Props) {
  const billingFormatted = formatAddress(addresses?.billing);
  const shippingFormatted = formatAddress(addresses?.shipping);

  return (
    <div className="space-y-8">
      <p className="text-[14px] text-gray-500">
        The following addresses will be used on the checkout page by default.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Billing Address */}
        <div>
          <h3 className="text-[22px] font-medium text-brand-primary-dark mb-4">Billing address</h3>
          <div className="bg-white border border-gray-200/80 rounded-sm p-6 min-h-[160px]">
            <Link 
              href="/account/addresses?edit=billing" 
              className="text-[#3498db] hover:underline text-[14px] font-medium transition-colors"
            >
              {billingFormatted ? 'Edit Billing address' : 'Add Billing address'}
            </Link>
            
            {billingFormatted ? (
              billingFormatted
            ) : (
              <p className="text-[14px] text-gray-500 italic mt-4">You have not set up this type of address yet.</p>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h3 className="text-[22px] font-medium text-brand-primary-dark mb-4">Shipping address</h3>
          <div className="bg-white border border-gray-200/80 rounded-sm p-6 min-h-[160px]">
            <Link 
              href="/account/addresses?edit=shipping" 
              className="text-[#3498db] hover:underline text-[14px] font-medium transition-colors"
            >
              {shippingFormatted ? 'Edit Shipping address' : 'Add Shipping address'}
            </Link>
            
            {shippingFormatted ? (
              shippingFormatted
            ) : (
              <p className="text-[14px] text-gray-500 italic mt-4">You have not set up this type of address yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
