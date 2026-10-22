'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useLenis } from 'lenis/react';

export function ScrollToTop() {
  const lenis = useLenis();
  
  const reset = () => {
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  useLayoutEffect(() => {
    reset();
  }, [lenis]);

  useEffect(() => {
    reset();
  }, [lenis]);

  return null;
}
