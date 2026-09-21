import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import {
  CATEGORIES,
  getFeaturedProducts,
  getProductsByCategory,
} from "@/lib/products";

export default async function Home() {
  const featured = await getFeaturedProducts();
  const sections = await Promise.all(
    CATEGORIES.map(async (category) => ({
      category,
      products: await getProductsByCategory(category),
    })),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">Featured</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {sections.map(({ category, products }) => (
        <section key={category} className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-zinc-900">{category}</h2>
            <Link
              href={`/search?category=${encodeURIComponent(category)}`}
              className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
