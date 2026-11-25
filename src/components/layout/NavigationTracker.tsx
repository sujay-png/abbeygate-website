'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) {
      return;
    }
    if (typeof (window as any).gtag === 'function') {
      const queryString = searchParams.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      (window as any).gtag('config', 'G-9H299B89WM', {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
