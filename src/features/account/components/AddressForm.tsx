'use client';

import { useActionState, useState } from 'react';
import { updateAddress, Address } from '@/features/account/services/address';
import Link from 'next/link';

type Props = {
  type: 'billing' | 'shipping';
  initialData: Address | null;
  billingData?: Address | null; 
};

export function AddressForm({ type, initialData, billingData }: Props) {
  const [state, action, isPending] = useActionState(updateAddress.bind(null, type), null);
  
  const [formData, setFormData] = useState<Partial<Address>>(initialData || {});

  const handleSameAsBilling = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && billingData) {
      setFormData(billingData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-sm p-6 md:p-8">
      {state?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6">
          {state.message}
        </div>
      )}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
          {state.message}
        </div>
      )}

      {type === 'shipping' && (
        <div className="mb-8 flex items-center bg-gray-50 p-4 border border-gray-100 rounded-md">
          <input 
            type="checkbox" 
            id="same-as-billing"
            onChange={handleSameAsBilling}
            className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer"
          />
          <label htmlFor="same-as-billing" className="ml-3 text-sm text-gray-700 font-medium cursor-pointer select-none">
            Same as Billing address
          </label>
        </div>
      )}

      <form action={action} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[14px] text-gray-700 font-medium">First name <span className="text-[#b00c0c]">*</span></label>
            <input 
              type="text" 
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleChange}
              required
              disabled={isPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[14px] text-gray-700 font-medium">Last name <span className="text-[#b00c0c]">*</span></label>
            <input 
              type="text" 
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleChange}
              required
              disabled={isPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {type === 'billing' && (
          <div className="space-y-2">
            <label className="text-[14px] text-gray-700 font-medium">Email address <span className="text-[#b00c0c]">*</span></label>
            <input 
              type="email" 
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              required
              disabled={isPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Country / Region <span className="text-[#b00c0c]">*</span></label>
          <select
            name="country"
            value={formData.country || 'GB'}
            onChange={handleChange}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
          >
            <option value="GB">United Kingdom (UK)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Street address <span className="text-[#b00c0c]">*</span></label>
          <input 
            type="text" 
            name="address_1"
            placeholder="House number and street name"
            value={formData.address_1 || ''}
            onChange={handleChange}
            required
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400 mb-2"
          />
          <input 
            type="text" 
            name="address_2"
            placeholder="Apartment, suite, unit, etc. (optional)"
            value={formData.address_2 || ''}
            onChange={handleChange}
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Town / City <span className="text-[#b00c0c]">*</span></label>
          <input 
            type="text" 
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            required
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">County (optional)</label>
          <input 
            type="text" 
            name="state"
            value={formData.state || ''}
            onChange={handleChange}
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Postcode <span className="text-[#b00c0c]">*</span></label>
          <input 
            type="text" 
            name="postcode"
            value={formData.postcode || ''}
            onChange={handleChange}
            required
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Phone (optional)</label>
          <input 
            type="tel" 
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button 
            type="submit"
            disabled={isPending}
            className="h-11 px-8 bg-black text-white text-[15px] font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Save address'
            )}
          </button>
          
          <Link href="/account/addresses" className="text-gray-500 text-sm hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
