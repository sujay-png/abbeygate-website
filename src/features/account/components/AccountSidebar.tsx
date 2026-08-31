'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutCustomer } from '@/features/auth/services/login';

const navItems = [
  { label: 'Dashboard', href: '/account/dashboard' },
  { label: 'Orders', href: '/account/orders' },
  { label: 'Addresses', href: '/account/addresses' },
  { label: 'Account Details', href: '/account/details' },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <h1 className="text-3xl font-bold text-brand-primary-dark font-sans tracking-tight mb-6">
        My Account
      </h1>
      
      <nav className="flex flex-col border border-gray-200/80 bg-white rounded-lg overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/account/dashboard');
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`px-5 py-3 text-[14px] transition-colors border-b border-gray-200/80 ${
                isActive 
                  ? 'bg-brand-tint font-medium text-brand-primary-dark' 
                  : 'text-gray-600 hover:bg-brand-cream hover:text-brand-primary-dark'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <form action={logoutCustomer}>
          <button type="submit" className="w-full text-left px-5 py-3 text-[14px] text-gray-600 hover:bg-brand-cream hover:text-red-600 transition-colors">
            Logout
          </button>
        </form>
      </nav>
    </aside>
  );
}
