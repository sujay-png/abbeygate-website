'use client';

import Link from 'next/link';
import { CustomerAddresses, Address } from '@/features/account/services/address';
import { useState, useEffect } from 'react';

type Props = {
  addresses: CustomerAddresses | null;
  success?: boolean;
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

export function AddressOverview({ addresses, success }: Props) {
  const [showSuccess, setShowSuccess] = useState(success);

  useEffect(() => {
    if (success) {
      // Clear the ?success=1 from the URL without triggering a page reload
      // so that if the user refreshes, the banner doesn't show up again.
      window.history.replaceState(null, '', '/account/addresses');
      
      // Auto-hide the banner after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  const billingFormatted = formatAddress(addresses?.billing);
  const shippingFormatted = formatAddress(addresses?.shipping);

  return (
    <div className="space-y-8">
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm transition-opacity duration-500 animate-in fade-in">
          Address saved successfully.
        </div>
      )}
      
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
