'use client';

import { useState, useActionState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { registerCustomer } from '@/features/auth/services/register';
import { loginCustomer } from '@/features/auth/services/login';
import { requestPasswordReset } from '@/features/auth/services/reset';

export function AuthForms() {
  const [activeView, setActiveView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  const [registerState, registerAction, isRegisterPending] = useActionState(registerCustomer, null);
  const [loginState, loginAction, isLoginPending] = useActionState(loginCustomer, null);
  const [forgotState, forgotAction, isForgotPending] = useActionState(requestPasswordReset, null);

  return (
    <div className="max-w-[480px] mx-auto w-full">
      {activeView === 'login' ? (
        <div className="w-full flex flex-col">
          <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-8 md:p-10 mb-8">
            <h2 className="text-3xl font-semibold text-brand-primary-dark mb-3 tracking-tight">Welcome Back</h2>
            <p className="text-gray-600 text-[15px] mb-8 leading-relaxed">
              Please log in to access bulk pricing, reseller discounts and customisation features.
            </p>
            
            <form className="space-y-6" action={loginAction}>
              {loginState?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {loginState.message}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[14px] text-gray-700 font-medium">
                  Email <span className="text-[#b00c0c]">*</span>
                </label>
                <input 
                  type="text" 
                  name="username"
                  placeholder="example@email.com"
                  required
                  disabled={isLoginPending}
                  className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50 placeholder:text-gray-400"
                />
              </div>
              
              <div className="space-y-2 relative">
                <label className="text-[14px] text-gray-700 font-medium">
                  Password <span className="text-[#b00c0c]">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="Your Password"
                    required
                    disabled={isLoginPending}
                    className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50 placeholder:text-gray-400"
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

              <div className="pt-1">
                <button 
                  type="button"
                  onClick={() => setActiveView('forgot-password')}
                  className="text-[13px] font-semibold text-brand-primary hover:text-brand-primary-dark uppercase tracking-wider transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <button 
                type="submit"
                disabled={isLoginPending}
                className="w-full h-12 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center uppercase tracking-wide"
              >
                {isLoginPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Log in'
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center flex flex-col items-center gap-1">
            <span className="text-[15px] text-gray-700 font-medium">New customer?</span>
            <button 
              onClick={() => setActiveView('register')}
              className="text-[14px] font-semibold tracking-wider text-brand-primary hover:text-brand-primary-dark transition-colors uppercase mt-1"
            >
              Create my account
            </button>
          </div>
        </div>
      ) : activeView === 'register' ? (
        <div className="w-full flex flex-col">
          <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-8 md:p-10 mb-8">
            <h2 className="text-3xl font-semibold text-brand-primary-dark mb-3 tracking-tight">Create Account</h2>
            <p className="text-gray-600 text-[15px] mb-8 leading-relaxed">
              Register for an account to access bulk pricing and faster checkout.
            </p>
            
            {registerState?.success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {registerState.message}
              </div>
            ) : (
              <form className="space-y-6" action={registerAction}>
                {registerState?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {registerState.message}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[14px] text-gray-700 font-medium">
                    Email address <span className="text-[#b00c0c]">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="example@email.com"
                    required
                    disabled={isRegisterPending}
                    className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50 placeholder:text-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[14px] text-gray-700 font-medium">
                    User Type <span className="text-[#b00c0c]">*</span>
                  </label>
                  <select 
                    name="userRole"
                    required
                    disabled={isRegisterPending}
                    className="w-full h-12 bg-white border border-gray-200 rounded-md px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[position:calc(100%-16px)_center] bg-no-repeat disabled:opacity-50"
                  >
                    <option value="">- - - Select User Role - - -</option>
                    <option value="individual">Individual Customer</option>
                    <option value="b2b">B2B (requires approval)</option>
                  </select>
                </div>

                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our <Link href="/privacy" className="text-brand-primary hover:underline transition-colors">privacy policy</Link>.
                </p>

                <button 
                  type="submit"
                  disabled={isRegisterPending}
                  className="w-full h-12 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center uppercase tracking-wide"
                >
                  {isRegisterPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Register'
                  )}
                </button>
              </form>
            )}
          </div>
          
          <div className="text-center flex flex-col items-center gap-1">
            <span className="text-[15px] text-gray-700 font-medium">Already have an account?</span>
            <button 
              onClick={() => setActiveView('login')}
              className="text-[14px] font-semibold tracking-wider text-brand-primary hover:text-brand-primary-dark transition-colors uppercase mt-1"
            >
              Log in
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col">
          <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-8 md:p-10 mb-8">
            <h2 className="text-3xl font-semibold text-brand-primary-dark mb-3 tracking-tight">Forgot Password</h2>
            <p className="text-gray-600 text-[15px] mb-8 leading-relaxed">
              Lost your password? Please enter your email address. You will receive a link to create a new password via email.
            </p>
            
            {forgotState?.success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {forgotState.message}
              </div>
            ) : (
              <form className="space-y-6" action={forgotAction}>
                {forgotState?.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {forgotState.message}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[14px] text-gray-700 font-medium">
                    Email address <span className="text-[#b00c0c]">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="example@email.com"
                    required
                    disabled={isForgotPending}
                    className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 disabled:opacity-50 placeholder:text-gray-400"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isForgotPending}
                  className="w-full h-12 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center uppercase tracking-wide"
                >
                  {isForgotPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Reset password'
                  )}
                </button>
              </form>
            )}
          </div>
          
          <div className="text-center flex flex-col items-center gap-1">
            <span className="text-[15px] text-gray-700 font-medium">Remember your password?</span>
            <button 
              onClick={() => setActiveView('login')}
              className="text-[14px] font-semibold tracking-wider text-brand-primary hover:text-brand-primary-dark transition-colors uppercase mt-1"
            >
              Log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
