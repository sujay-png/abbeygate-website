import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  title: string;
  image: string;
  href: string;
  priority?: boolean;
}

export function CategoryCard({
  title,
  image,
  href,
  priority = false,
}: CategoryCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-neutral-100">
        <Image
          src={image}
          alt={title}
          fill
          priority={priority}
          unoptimized={true}
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 46vw"
        />
      </div>

      <h3 className="mt-4 text-center font-josefin text-[19px] font-semibold text-black">
        {title}
      </h3>
    </Link>
  );
}