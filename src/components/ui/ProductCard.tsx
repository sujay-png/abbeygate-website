import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  title: string;
  description: string;
  price: string;
  imageUrl?: string;
  fallbackColor?: string;
  href?: string;
}

export const ProductCard = ({
  title,
  description,
  price,
  imageUrl,
  fallbackColor = "bg-gray-300",
  href = "#",
}: ProductCardProps) => {
  return (
    <Link href={href} className="mt-10 group flex flex-col bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="h-[280px] w-full flex items-center justify-center p-8 relative overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain scale-110 transition-transform duration-500 group-hover:scale-125"
          />
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

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-3 group-hover:text-brand-primary-dark transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-6 flex-grow">
          {description}
        </p>
        <div className="mt-auto">
          <span className="text-gray-500 font-medium">{price}</span>
        </div>
      </div>
    </Link>
  );
};
