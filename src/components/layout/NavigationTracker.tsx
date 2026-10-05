'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const url = pathname + searchParams.toString();
      window.gtag('config', 'G-9H299B89WM', {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
