import { Metadata } from 'next';

import { getSEOMetadata } from '@/lib/seo';
export const metadata: Metadata = getSEOMetadata("/cart");

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
