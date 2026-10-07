import type { Metadata } from 'next';

import { getSEOMetadata } from '@/lib/seo';
export const metadata: Metadata = getSEOMetadata("/checkout");

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
