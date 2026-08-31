'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { updateAccountDetails, AccountDetails } from '@/features/account/services/customer';

type Props = {
  initialData: AccountDetails | null;
};

export function AccountDetailsForm({ initialData }: Props) {
  const [state, action, isPending] = useActionState(updateAccountDetails, null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-6 md:p-8">
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

      <form action={action} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[14px] text-gray-700 font-medium">First name <span className="text-[#b00c0c]">*</span></label>
            <input 
              type="text" 
              name="first_name"
              defaultValue={initialData?.first_name || ''}
              required
              disabled={isPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[14px] text-gray-700 font-medium">Last name <span className="text-[#b00c0c]">*</span></label>
            <input 
              type="text" 
              name="last_name"
              defaultValue={initialData?.last_name || ''}
              required
              disabled={isPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Display name <span className="text-[#b00c0c]">*</span></label>
          <input 
            type="text" 
            name="display_name"
            defaultValue={initialData?.display_name || ''}
            required
            disabled={isPending}
            className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
          />
          <p className="text-[13px] text-gray-500 italic mt-1">This will be how your name will be displayed in the account section and in reviews</p>
        </div>

        <div className="space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Email address <span className="text-[#b00c0c]">*</span></label>
          <input 
            type="email" 
            name="email"
            defaultValue={initialData?.email || ''}
            disabled
            className="w-full h-12 bg-gray-50/80 border border-gray-200 rounded-md px-4 text-gray-500 cursor-not-allowed focus:outline-none"
          />
          <p className="text-[13px] text-gray-500 italic mt-1">Your email address cannot be changed from this screen.</p>
        </div>

        <div className="pt-4 space-y-6">
          <h3 className="text-[18px] font-semibold text-brand-primary-dark">Password change</h3>
          
          <div className="space-y-2 relative">
            <label className="text-[14px] text-gray-700 font-medium">Current password (leave blank to leave unchanged)</label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                name="current_password"
                disabled={isPending}
                className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 pr-10 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-[14px] text-gray-700 font-medium">New password (leave blank to leave unchanged)</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                name="new_password"
                disabled={isPending}
                className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 pr-10 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-[14px] text-gray-700 font-medium">Confirm new password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                name="confirm_new_password"
                disabled={isPending}
                className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 pr-10 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <label className="text-[14px] text-gray-700 font-medium">Default currency</label>
          <input 
            type="text" 
            value="£ GBP"
            disabled
            className="w-full h-12 bg-gray-50/80 border border-gray-200 rounded-md px-4 text-gray-500 cursor-not-allowed"
          />
          <p className="text-[13px] text-gray-500 italic mt-1">Select your preferred currency for shopping and payments.</p>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isPending}
            className="h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center min-w-[140px]"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
