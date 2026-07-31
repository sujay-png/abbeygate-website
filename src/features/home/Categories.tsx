import Link from "next/link";
import { Container } from "@/features/shared/Container";
import { CategoryCard } from "@/features/shared/CategoryCard";
import { Button } from "@/features/shared/Button";

const CATEGORIES = [
  {
    title: "Diaries",
    image:
      "https://corporate.abbeygate-england.com/wp-content/uploads/2026/07/diaries-collection.webp",
    href: "/diaries",
  },
  {
    title: "Journals & Notebooks",
    image:
      "https://corporate.abbeygate-england.com/wp-content/uploads/2026/07/Screenshot_2024-11-18_at_22.03.10.webp",
    href: "/journals",
  },
];

export const Categories = () => {
  return (
    <section className="bg-white py-16">
      <Container>
        {/* Header — stacks on mobile, row on larger screens */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="font-josefin text-[26px] font-bold tracking-tight text-black lg:text-[32px]">
            Crafted Collections, Designed to Impress
          </h2>

          <Button href="/collections" variant="primary" className="self-start sm:self-auto">
            Shop All
          </Button>
        </div>

        {/* Categories — centered as a narrower block within the full-width section */}
        <div className="mx-auto mt-16 grid max-w-[900px] grid-cols-1 gap-8 pb-16 md:grid-cols-2 lg:gap-12">
          {CATEGORIES.map((category, idx) => (
            <CategoryCard key={category.title} {...category} priority={idx === 0} />
          ))}
        </div>

        {/* Divider */}
        <div className="border-b border-neutral-300" />
      </Container>
    </section>
  );
};