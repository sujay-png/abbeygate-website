import { ReactNode } from 'react';
import Image from 'next/image';
import { Container } from '../ui/Container';

interface TextWithImageGridProps {
  title: string;
  content: string | ReactNode;
  images: string[];
  className?: string;
}

export function TextWithImageGrid({
  title,
  content,
  images,
  className = '',
}: TextWithImageGridProps) {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <Container maxWidthClass="max-w-[1400px]">
        {/* Top Text Section */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 mb-10">
          <div className="md:w-1/3">
            <h2 className="text-2xl md:text-3xl font-bold text-black font-sans tracking-tight">
              {title}
            </h2>
          </div>
          <div className="md:w-2/3">
            <div className="prose prose-gray font-work max-w-none text-[#1F2124]/80 text-[15px] leading-relaxed">
              {typeof content === 'string' ? <div dangerouslySetInnerHTML={{ __html: content }} /> : content}
            </div>
          </div>
        </div>

        {/* Bottom Image Grid */}
        {images.length > 0 && (
          <div 
            className={`grid gap-4 md:gap-6`} 
            style={{ gridTemplateColumns: `repeat(${images.length}, minmax(0, 1fr))` }}
          >
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
                <Image
                  src={img}
                  alt={`${title} image ${idx + 1}`}
                  fill
                  unoptimized={img.includes('unsplash.com')}
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
