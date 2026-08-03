import { ReactNode } from 'react';
import Image from 'next/image';
import { Container } from '../ui/Container';

interface ImageTextSectionProps {
  image: string;
  title: string;
  content: string | ReactNode;
  imageAlignment?: 'left' | 'right';
  className?: string;
}

export function ImageTextSection({
  image,
  title,
  content,
  imageAlignment = 'left',
  className = '',
}: ImageTextSectionProps) {
  const isLeft = imageAlignment === 'left';
  
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <Container maxWidthClass="max-w-[1500px]">
        <div className={`flex flex-col gap-12 lg:gap-16 items-center lg:items-stretch ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
          {/* Image Side */}
          <div className="w-full lg:w-1/2 relative aspect-[4/3] lg:aspect-auto rounded-lg overflow-hidden shadow-sm lg:my-[30px]">
            <Image 
              src={image}
              alt={title}
              fill
              quality = {95}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          
          {/* Text Side */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-2xl md:text-3xl font-bold text-black font-sans tracking-tight mb-6">
              {title}
            </h2>
            <div className="prose prose-gray font-work max-w-none text-[#1F2124]/80 text-[15px] leading-relaxed">
              {typeof content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                content
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
