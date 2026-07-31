import { Container } from "../ui/Container";
import { ProductCard } from "../ui/ProductCard";
import { Button } from "../ui/Button";

import { ArrowIcon } from "../ui/ArrowIcon";
const bestSellers = [
  {
    id: 1,
    title: "Ocean Clean A5 Eco Notebook, Grey",
    description:
      "The Ocean Clean A5 Eco Notebook combines sustainability with practicality, featuring feint ruled white FSC-certified...",
    price: "£19.50",
    imageUrl: "/images/products/featured-notebook-grey.jpg",
  },
  {
    id: 2,
    title: "Lewes SmoothGrain A5 Notebook, Feint Ruled, Red",
    description:
      "With its luxurious Harrogate cover and practical features, the Harrogate Faux Leather A5 Notebook offers...",
    price: "£7.50",
    imageUrl: "/images/products/featured-notebook-red.webp",
  },
  {
    id: 3,
    title: "Apple Peel Eco, vegan / peel A5 Notebook, Feint Ruled, Green",
    description:
      "Eco-friendly and stylish, the Apple Peel Eco, vegan / peel A5 Eco Notebook features a...",
    price: "£18.50",
    imageUrl: "/images/products/featured-notebook-green.webp",
  },
  {
    id: 4,
    title: "Chelsea Leather Quarto Diary, Week To View, Black",
    description:
      "Chelsea Leather range, luxury soft grained real leather?week to view layout.?Smyth sewn sections for strength...",
    price: "£26.99",
    imageUrl: "/images/products/featured-notebook-black.png",
  },
];

export const FeaturedProducts = () => {
  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="relative inline-block">
            <h2 className="text-3xl font-extrabold text-black font-sans tracking-tight">
              Best Sellers
            </h2>
            <ArrowIcon className="absolute -right-22 -top-1 hidden md:block" />
          </div>

          <Button href="/collections" variant="primary" className="md:w-auto w-full max-w-[200px]">
            Shop All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 lg:px-12 xl:px-20">
          {bestSellers.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              description={product.description}
              price={product.price}
              imageUrl={product.imageUrl}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};
