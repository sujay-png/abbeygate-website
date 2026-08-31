'use client';

import { useActionState } from 'react';
import { triggerLinkOrdersEmail } from '@/features/account/services/link-orders';

export function LinkOrdersBanner() {
  const [state, action, isPending] = useActionState(triggerLinkOrdersEmail, null);

  if (state?.success) {
    return (
      <div className="bg-[#f0f9f0] border-l-4 border-[#4caf50] border border-[#e0e0e0] p-4 mb-8 flex items-center gap-3 rounded shadow-sm text-sm text-gray-700">
        <svg className="w-5 h-5 text-[#4caf50] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {state.message}
      </div>
    );
  }

  return (
    <div className="bg-[#f0f7fb] border-l-4 border-[#3498db] p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-r-md">
      <div className="flex items-center gap-3 text-sm text-gray-700">
        <svg className="w-5 h-5 text-[#3498db] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Confirm your email address to check for past orders and link them to your account.
      </div>
      <form action={action}>
        <button 
          type="submit" 
          disabled={isPending}
          className="whitespace-nowrap px-4 py-2 bg-[#e2eff7] text-[#3498db] text-sm font-medium rounded hover:bg-[#d0e4f2] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Sending...' : 'Confirm email address'}
        </button>
      </form>
      {state?.error && (
        <div className="w-full mt-2 text-sm text-red-600">
          {state.message}
        </div>
      )}
    </div>
  );
}
