import { Container } from '../ui/Container';
import { Button } from '../ui/Button';

interface CTASectionProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonHref: string;
}

export function CTASection({ title, description, buttonText, buttonHref }: CTASectionProps) {
  return (
    <section className="py-16 bg-[#512D6D]">
      <Container>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white font-sans mb-4">
            {title}
          </h2>
          {description && (
            <p className="text-white/80 font-work mb-8 text-lg">
              {description}
            </p>
          )}
          <Button variant="secondary" href={buttonHref}>
            {buttonText}
          </Button>
        </div>
      </Container>
    </section>
  );
}
