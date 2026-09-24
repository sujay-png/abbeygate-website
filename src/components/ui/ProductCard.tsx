import Link from "next/link";
import Image from "next/image";
import { PriceDisplay } from "@/components/shared/PriceDisplay";

interface ProductCardProps {
  title: string;
  description: string;
  baseAmount?: number;

  imageUrl?: string;
  fallbackColor?: string;
  href?: string;
  compact?: boolean;
}

export const ProductCard = ({
  title,
  description,
  baseAmount,
  imageUrl,
  fallbackColor = "bg-gray-300",
  href = "#",
  compact = false,
}: ProductCardProps) => {
  return (
    <Link href={href} className="group flex flex-col bg-transparent rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className={`${compact ? 'h-[200px] p-4' : 'h-[280px] p-6 md:p-10'} w-full relative overflow-hidden bg-transparent`}>
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={title}
              fill
              quality={75}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply"
            />
          </div>
        ) : (
          <div
            className={`w-[140px] h-[190px] ${fallbackColor} rounded-r-md shadow-md relative transition-transform duration-500 group-hover:scale-105`}
          >
            {/* Notebook spine detail */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/10 rounded-l-sm border-r border-black/5" />
            {/* Notebook elastic band (optional, for some styles) */}
            {(fallbackColor.includes("red") || fallbackColor.includes("green")) && (
              <div className="absolute right-4 top-0 bottom-0 w-1.5 bg-black/10" />
            )}
          </div>
        )}
      </div>

      <div className={`${compact ? 'p-4' : 'p-6'} flex flex-col flex-grow`}>
        <h3 className={`${compact ? 'text-[14px]' : 'text-base'} font-bold text-gray-900 leading-snug mb-2 group-hover:text-brand-primary-dark transition-colors duration-300`}>
          {title}
        </h3>
        <p className={`${compact ? 'text-[12px] mb-4' : 'text-sm mb-6'} text-gray-500 leading-relaxed line-clamp-3 flex-grow`}>
          {description}
        </p>
        <div className="mt-auto">
          {baseAmount !== undefined && baseAmount > 0 && (
            <span className="text-gray-500 font-medium flex gap-1">
              <PriceDisplay amount={baseAmount} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
