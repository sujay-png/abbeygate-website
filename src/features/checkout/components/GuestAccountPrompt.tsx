'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  email?: string;
  orderId?: string;
  orderKey?: string;
  stripeIntentId?: string;
};

export function GuestAccountPrompt({ email, orderId, orderKey, stripeIntentId }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          orderId,
          orderKey,
          stripeIntentId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh(); // Refresh the page to reflect logged-in state
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-brand-primary-dark/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-brand-grey hover:text-brand-primary transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10 text-center">
          {success ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-brand-primary-dark mb-2">Account Created!</h2>
              <p className="text-brand-grey">Your order has been saved to your new account.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-brand-primary-dark mb-2">Add a Password to Create an Account or Sign In</h2>
              
              <ul className="text-left text-sm text-brand-grey mt-6 mb-8 space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  Save your order to My Orders
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  Save Baskets to return to later
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  Save your Delivery and Billing Addresses for a faster checkout
                </li>
              </ul>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded text-left">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {email && (
                  <div className="text-left text-sm text-brand-grey mb-4 font-medium">
                    Email: <span className="text-brand-primary-dark">{email}</span>
                  </div>
                )}
                
                <div className="text-left">
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full bg-brand-primary text-white font-bold hover:bg-brand-primary-dark transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Create Account'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-brand-grey hover:text-brand-primary underline transition-colors py-2"
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
