import { ReactNode } from 'react';
import { Container } from '../ui/Container';

interface FeatureCalloutProps {
  title: string;
  content: string | ReactNode;
  className?: string;
}

export function FeatureCallout({ title, content, className = '' }: FeatureCalloutProps) {
  return (
    <section className={`py-12 ${className}`}>
      <Container maxWidthClass="max-w-[1500px]">
        <div className="bg-brand-tint rounded-xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="md:w-1/3">
            <h3 className="text-2xl md:text-3xl font-bold text-brand-primary-dark font-sans tracking-tight">
              {title}
            </h3>
          </div>
          <div className="md:w-2/3">
            <div className="prose prose-gray font-work max-w-none text-brand-body/80 text-[15px] leading-relaxed">
              {typeof content === 'string' ? <div dangerouslySetInnerHTML={{ __html: content }} /> : content}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
