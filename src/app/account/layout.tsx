import { Metadata } from 'next';

import { getSEOMetadata } from '@/lib/seo';
export const metadata: Metadata = getSEOMetadata("/account", { title: "My Account | Abbeygate England", noindex: true });

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
