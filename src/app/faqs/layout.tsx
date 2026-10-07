import type { Metadata } from "next";
import { getSEOMetadata } from "@/lib/seo";

// The page itself is a client component, which can't export metadata, so it lives here.
export const metadata: Metadata = getSEOMetadata("/faqs");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
