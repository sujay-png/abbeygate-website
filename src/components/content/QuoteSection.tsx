import { Container } from '../ui/Container';
import { Quote } from 'lucide-react';

interface QuoteSectionProps {
  quote: string;
  author?: string;
  role?: string;
}

export function QuoteSection({ quote, author, role }: QuoteSectionProps) {
  return (
    <section className="py-16 bg-[#F8F9FA]">
      <Container>
        <div className="max-w-4xl mx-auto text-center relative">
          <Quote className="w-12 h-12 text-[#512D6D]/20 absolute -top-6 left-1/2 -translate-x-1/2" />
          <blockquote className="relative z-10">
            <p className="text-2xl md:text-3xl font-work italic text-[#1F2124] leading-relaxed mb-6">
              "{quote}"
            </p>
            {(author || role) && (
              <footer className="font-sans">
                {author && <strong className="block text-lg font-bold text-black">{author}</strong>}
                {role && <span className="text-gray-500 text-sm tracking-wide uppercase">{role}</span>}
              </footer>
            )}
          </blockquote>
        </div>
      </Container>
    </section>
  );
}
