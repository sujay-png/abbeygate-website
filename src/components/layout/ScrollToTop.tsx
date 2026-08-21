'use client';

import { useEffect } from 'react';
import { useLenis } from 'lenis/react';

export function ScrollToTop() {
  const lenis = useLenis();
  
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
  }, [lenis]);

  return null;
}
