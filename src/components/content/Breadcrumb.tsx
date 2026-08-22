import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '../ui/Container';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  paths: BreadcrumbItem[];
}

export function Breadcrumb({ paths }: BreadcrumbProps) {
  return (
    <div className="py-4 bg-brand-cream">
      <Container maxWidthClass="max-w-[1500px]">
        <nav aria-label="Breadcrumb" className="flex items-center text-sm">
          {paths.map((path, index) => {
            const isLast = index === paths.length - 1;
            
            return (
              <div key={index} className="flex items-center">
                {path.href ? (
                  <Link 
                    href={path.href}
                    className="text-gray-500 hover:text-brand-primary-dark transition-colors font-sans"
                  >
                    {path.label}
                  </Link>
                ) : (
                  <span className="text-brand-primary-dark font-sans" aria-current="page">
                    {path.label}
                  </span>
                )}
                
                {!isLast && (
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                )}
              </div>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}
