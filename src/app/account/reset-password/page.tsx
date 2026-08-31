'use client';

import { useState, useActionState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { resetCustomerPassword } from '@/features/auth/services/reset';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const resetKey = searchParams.get('key');
  const login = searchParams.get('login') || searchParams.get('id'); // Fallback to id if login isn't present
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetState, resetAction, isResetPending] = useActionState(resetCustomerPassword, null);

  if (!resetKey || !login) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
        <p className="mb-4">This password reset link is invalid or has expired.</p>
        <Link 
          href="/account"
          className="inline-flex h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark transition-all duration-200 items-center justify-center"
        >
          Return to Login
        </Link>
      </div>
    );
  }

  if (resetState?.success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">Password Updated!</h2>
        <p className="mb-6">{resetState.message}</p>
        <Link 
          href="/account"
          className="inline-flex h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark transition-all duration-200 items-center justify-center"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" action={resetAction}>
      <input type="hidden" name="key" value={resetKey} />
      <input type="hidden" name="login" value={login} />

      {resetState?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {resetState.message}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-gray-600 text-sm mb-4">Enter a new password below.</p>

        <div className="space-y-2 relative">
          <label className="text-[14px] text-gray-700 font-medium">
            New password <span className="text-[#b00c0c]">*</span>
          </label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              required
              minLength={8}
              disabled={isResetPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="text-[14px] text-gray-700 font-medium">
            Re-enter new password <span className="text-[#b00c0c]">*</span>
          </label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              name="confirmPassword"
              required
              minLength={8}
              disabled={isResetPending}
              className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50"
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

      <div className="pt-4">
        <button 
          type="submit"
          disabled={isResetPending}
          className="w-full sm:w-auto h-11 px-10 bg-black text-white text-[15px] font-medium rounded-md hover:bg-gray-800 hover:shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center min-w-[140px]"
        >
          {isResetPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Save'
          )}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account', href: '/account' }, { label: 'Reset Password' }]} />
      
      <Container maxWidthClass="max-w-[800px]" className="py-8 md:py-16">
        <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-6 md:p-10">
          <h1 className="text-3xl font-bold text-brand-primary-dark font-sans tracking-tight mb-8">
            My Account
          </h1>
          
          <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </Container>
    </main>
  );
}
