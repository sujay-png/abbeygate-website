import { ReactNode } from 'react';
import { Container } from '../ui/Container';

interface RichTextSectionProps {
  content: string | ReactNode;
  alignment?: 'left' | 'center';
  className?: string;
}

export function RichTextSection({ content, alignment = 'center', className = '' }: RichTextSectionProps) {
  return (
    <section className={`py-12 md:py-16 ${className}`}>
      <Container>
        <div className={`max-w-3xl mx-auto prose prose-lg prose-gray font-work text-[#1F2124]/80 ${alignment === 'center' ? 'text-center' : 'text-left'}`}>
          {typeof content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            content
          )}
        </div>
      </Container>
    </section>
  );
}
