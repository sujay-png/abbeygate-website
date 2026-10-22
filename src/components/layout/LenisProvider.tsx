"use client";

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function RouteChangeScroller() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lenis = useLenis();

  const resetScroll = () => {
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Immediate scroll to top the moment user clicks any internal link
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.includes('#') &&
        anchor.target !== '_blank' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        resetScroll();
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [lenis]);

  useEffect(() => {
    resetScroll();
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
