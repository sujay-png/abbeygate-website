'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Check, UserCheck, Lock } from 'lucide-react';

type Props = {
  email?: string;
  orderId?: string | number;
  orderKey?: string;
  stripeIntentId?: string;
  className?: string;
};

export function GuestAccountSection({ email, orderId, orderKey, stripeIntentId, className = '' }: Props) {
  const [view, setView] = useState<'register' | 'login'>('register');
  const [password, setPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState(email || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Your order has been saved to your account.');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || loginEmail,
          password,
          orderId: orderId ? String(orderId) : undefined,
          orderKey,
          stripeIntentId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccessMessage('Your account has been created! Taking you to My Account...');
      setSuccess(true);
      setTimeout(() => {
        router.push('/account');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/claim-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginEmail || email,
          password,
          orderId: orderId ? String(orderId) : undefined,
          orderKey,
          stripeIntentId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials or login failed');
      }

      setSuccessMessage('Logged in successfully! Taking you to My Account...');
      setSuccess(true);
      setTimeout(() => {
        router.push('/account');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to log in and save order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`bg-[#f0f9f4] border border-[#bbf7d0] p-6 text-brand-body ${className}`}>
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-7 h-7 text-[#16a34a] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-[#14532d] text-lg">Order Saved to My Account!</h3>
            <p className="text-sm text-[#166534]">{successMessage}</p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/account"
                className="inline-flex items-center justify-center bg-brand-primary text-white text-xs font-bold px-4 py-2 hover:bg-brand-primary-dark transition-colors tracking-wide uppercase"
              >
                Go to My Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-brand-cream border border-[var(--brand-border)] p-6 sm:p-7 text-brand-body ${className}`}>
      {/* Top Banner: Login option */}
      <div className="flex items-center justify-between border-b border-[var(--brand-border)] pb-3 mb-4 text-xs sm:text-sm">
        <span className="text-brand-grey">
          Have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setView(view === 'register' ? 'login' : 'register');
              setError(null);
            }}
            className="font-semibold text-brand-primary hover:text-brand-primary-dark underline decoration-brand-primary underline-offset-2 transition-colors cursor-pointer"
          >
            {view === 'register' ? 'Log in to save this order in My Account.' : 'Create a new account instead.'}
          </button>
        </span>
      </div>

      {view === 'register' ? (
        <div>
          <p className="text-sm text-brand-primary-dark font-medium mb-3">
            If you don’t have an account, add a password to save this order. You can also:
          </p>

          <ul className="space-y-2 mb-6 text-xs sm:text-sm text-brand-grey pl-1">
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Save baskets to My Account</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Save address &amp; payment details for faster checkout</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-brand-primary shrink-0" />
              <span>Save your Logos for faster customisations</span>
            </li>
          </ul>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded">
              <p>{error}</p>
              {error.toLowerCase().includes('already exists') && (
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError(null);
                  }}
                  className="mt-1 font-semibold text-brand-primary hover:underline block"
                >
                  Click here to log in with this email
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            {email && (
              <div className="text-xs text-brand-grey">
                Account email: <strong className="text-brand-primary-dark">{email}</strong>
              </div>
            )}

            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold text-brand-primary-dark uppercase tracking-wider mb-1.5">
                Create account :
              </label>
              <div className="relative flex items-center">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full h-11 bg-white border border-[var(--brand-border)] px-3.5 pr-10 text-sm text-brand-primary-dark placeholder:text-brand-grey/60 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-brand-grey hover:text-brand-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full h-11 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      ) : (
        /* Login view */
        <div>
          <h4 className="text-sm font-semibold text-brand-primary-dark mb-1">
            Log in to save this order to My Account
          </h4>
          <p className="text-xs text-brand-grey mb-4">
            Enter your credentials to link this order to your existing account.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-brand-primary-dark uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full h-10 bg-white border border-[var(--brand-border)] px-3 text-sm text-brand-primary-dark focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-brand-primary-dark uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full h-10 bg-white border border-[var(--brand-border)] px-3 pr-10 text-sm text-brand-primary-dark focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-brand-grey hover:text-brand-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !password}
                className="w-full h-10 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isSubmitting ? 'Logging in & Linking...' : 'Log in & Save Order'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('register');
                  setError(null);
                }}
                className="text-xs text-brand-grey hover:text-brand-primary underline transition-colors text-center py-1 cursor-pointer"
              >
                Don't have an account? Create one with a password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
