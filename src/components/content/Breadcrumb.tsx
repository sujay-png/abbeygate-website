import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Container } from '../ui/Container';
import { SITE_URL, jsonLd } from '@/lib/seo';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  paths: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ paths, className = '' }: BreadcrumbProps) {
  if (!paths || paths.length === 0) return null;

  // Find previous level for mobile back link (last ancestor with an href before current page)
  let previousItem: BreadcrumbItem | null = null;
  for (let i = paths.length - 2; i >= 0; i--) {
    if (paths[i]?.href) {
      previousItem = paths[i];
      break;
    }
  }

  // Fallback to Home if there are multiple items but no direct ancestor with href
  if (!previousItem && paths.length > 1) {
    previousItem = paths[0]?.href ? paths[0] : { label: 'Home', href: '/' };
  }

  // Generate structured BreadcrumbList schema for search engines
  const schemaItems = paths.map((item, index) => {
    const isLast = index === paths.length - 1;
    const itemUrl = item.href
      ? (item.href.startsWith('http') ? item.href : `${SITE_URL}${item.href}`)
      : undefined;

    return {
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(itemUrl && !isLast ? { item: itemUrl } : {}),
    };
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems,
  };

  return (
    <div className={`py-3 md:py-4 bg-brand-cream ${className}`}>
      <Container maxWidthClass="max-w-[1500px]">
        {/* Desktop View: Full canonical breadcrumb trail */}
        <nav aria-label="Breadcrumb" className="hidden md:block">
          <ol className="flex items-center flex-wrap gap-y-1 text-sm">
            {paths.map((path, index) => {
              const isLast = index === paths.length - 1;

              return (
                <li key={index} className="flex items-center">
                  {path.href && !isLast ? (
                    <Link
                      href={path.href}
                      className="text-gray-500 hover:text-brand-primary-dark transition-colors font-sans"
                    >
                      {path.label}
                    </Link>
                  ) : (
                    <span className="text-brand-primary-dark font-medium font-sans" aria-current="page">
                      {path.label}
                    </span>
                  )}

                  {!isLast && (
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-400 shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Mobile View: Clean "Back to [Previous Level]" link (Candle Shack / modern e-commerce pattern) */}
        {previousItem && previousItem.href && (
          <nav aria-label="Mobile Breadcrumb" className="flex md:hidden items-center">
            <Link
              href={previousItem.href}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-brand-primary-dark transition-colors font-sans py-0.5"
            >
              <ChevronLeft className="w-4 h-4 mr-1 text-gray-500 shrink-0" aria-hidden="true" />
              <span>Back to {previousItem.label}</span>
            </Link>
          </nav>
        )}
      </Container>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
    </div>
  );
}
