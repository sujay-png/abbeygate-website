"use client";

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, useRef, Suspense } from 'react';
import { usePathname } from 'next/navigation';

function RouteChangeScroller() {
  const pathname = usePathname();
  const lenis = useLenis();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only reset scroll once the new route has committed (not on initial link click before
    // loading.tsx mounts, and not when only filter searchParams change with scroll: false).
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    if (lenis) {
      lenis.stop();
      lenis.resize();
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.start();
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, lenis]);

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
