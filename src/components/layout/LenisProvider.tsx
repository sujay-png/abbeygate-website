"use client";

import { ReactLenis } from 'lenis/react';
import { ReactNode } from 'react';

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root>
      {children}
    </ReactLenis>
  );
}
