'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';

export default function AccountPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'My Account' }]} />
      
      <Container maxWidthClass="max-w-[1400px]" className="py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-brand-primary-dark font-sans tracking-tight mb-8 md:mb-12">
          My Account
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          
          {/* Login Card */}
          <div className="w-full flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-brand-primary-dark mb-6">Login</h2>
            <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-6 md:p-8 flex-1">
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-[14px] text-gray-700 font-medium">
                    Username or email address <span className="text-[#b00c0c]">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2 relative">
                  <label className="text-[14px] text-gray-700 font-medium">
                    Password <span className="text-[#b00c0c]">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200"
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

                <div className="flex items-center gap-4 pt-2">
                  <button 
                    type="submit"
                    className="h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                  >
                    Log in
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-primary-dark focus:ring-black cursor-pointer" />
                    <span className="text-[14px] text-gray-600 group-hover:text-brand-primary-dark transition-colors">Remember me</span>
                  </label>
                </div>

                <div className="pt-2">
                  <Link href="#" className="text-[14px] text-brand-primary hover:text-brand-primary-dark underline underline-offset-4 transition-colors">
                    Lost your password?
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Register Card */}
          <div className="w-full flex flex-col h-full">
            <h2 className="text-2xl font-semibold text-brand-primary-dark mb-6">Register</h2>
            <div className="bg-white border border-gray-200/80 rounded-lg shadow-sm p-6 md:p-8 flex-1">
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <label className="text-[14px] text-gray-700 font-medium">
                    Email address <span className="text-[#b00c0c]">*</span>
                  </label>
                  <input 
                    type="email" 
                    className="w-full h-12 bg-gray-50/50 border border-gray-200 rounded-md px-4 text-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200"
                  />
                </div>
                
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  A link to set a new password will be sent to your email address.
                </p>
                
                <div className="space-y-2 pt-2">
                  <label className="text-[14px] text-gray-700 font-medium">
                    User Type <span className="text-[#b00c0c]">*</span>
                  </label>
                  <select className="w-full h-12 bg-white border border-gray-200 rounded-md px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[position:calc(100%-16px)_center] bg-no-repeat">
                    <option value="">- - - Select User Role - - -</option>
                    <option value="individual">Individual Customer</option>
                    <option value="b2b">B2B (requires approval)</option>
                  </select>
                </div>

                <p className="text-[13px] text-gray-500 leading-relaxed pt-2">
                  Your personal data will be used to support your experience throughout this website, to manage access to your account, and for other purposes described in our <Link href="/privacy" className="text-brand-primary hover:text-brand-primary-dark underline underline-offset-2 transition-colors">privacy policy</Link>.
                </p>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="h-11 px-8 bg-brand-primary text-white text-[15px] font-medium rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                  >
                    Register
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </Container>
    </main>
  );
}
