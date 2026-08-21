"use client";

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function RouteChangeScroller() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, searchParams, lenis]);

  return null;
}

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root>
      <Suspense fallback={null}>
        <RouteChangeScroller />
      </Suspense>
      {children}
    </ReactLenis>
  );
}
