import Image from 'next/image';
import { BespokeFeature } from '../types';

interface BespokeFeatureSectionProps {
  feature: BespokeFeature;
}

export function BespokeFeatureSection({ feature }: BespokeFeatureSectionProps) {
  const {
    id,
    kicker,
    title,
    imageSrc,
    imageAlt,
    paragraphs,
    optionsTitle,
    bullets,
    afterText,
    isFlipped,
  } = feature;

  return (
    <section
      id={id}
      className="scroll-mt-[160px] md:scroll-mt-[230px] lg:scroll-mt-[240px] first:border-t-0 border-t border-brand-grey/25 py-12 md:py-16 lg:py-20"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        {/* Media Column */}
        <div
          className={`relative aspect-[4/3] rounded-md overflow-hidden bg-brand-tint shadow-sm ${
            isFlipped ? 'md:order-2' : 'md:order-1'
          }`}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={id === 'blocking-foiling' || id === 'ribbon'}
          />
        </div>

        {/* Copy Column */}
        <div className={`flex flex-col justify-center ${isFlipped ? 'md:order-1' : 'md:order-2'}`}>
          <p className="text-xs font-bold tracking-widest text-brand-grey uppercase mb-2">
            {kicker}
          </p>
          <h2 className="text-2xl lg:text-[34px] font-bold font-josefin tracking-tight text-brand-primary-dark leading-snug mb-5">
            {title}
          </h2>

          <div className="flex flex-col gap-3">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="text-[15px] text-brand-body/90 font-work leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {optionsTitle && (
            <h3 className="text-sm font-bold tracking-wider text-brand-primary-dark uppercase mt-6 mb-2">
              {optionsTitle}
            </h3>
          )}

          {bullets && bullets.length > 0 && (
            <ul className="flex flex-col gap-2.5 mt-3">
              {bullets.map((b, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[15px] text-brand-body/90 font-work leading-relaxed">
                  <span
                    aria-hidden="true"
                    className="w-[7px] h-[7px] rounded-full bg-brand-gold mt-[0.55rem] shrink-0"
                  />
                  <span>
                    <strong className="text-brand-primary-dark font-bold">{b.title}: </strong>
                    {b.description}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {afterText && (
            <p className="text-[15px] text-brand-body/90 font-work leading-relaxed mt-5">
              {afterText}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

