import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import {
  CATEGORIES,
  SORTS,
  normalizeSearchParams,
  searchProducts,
  type Category,
  type Sort,
} from "@/lib/products";

const SORT_LABELS: Record<Sort, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Avg. rating",
};

function searchHref(q: string, category: Category | undefined, sort: Sort) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (sort !== "featured") params.set("sort", sort);
  const qs = params.toString();
  return `/search${qs ? `?${qs}` : ""}`;
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const { q, category, sort } = normalizeSearchParams(await searchParams);
  const products = await searchProducts({ q, category, sort });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900">
        {q ? `Results for "${q}"` : "All products"}
        {category ? ` in ${category}` : ""}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {products.length} {products.length === 1 ? "result" : "results"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={searchHref(q, undefined, sort)}
          className={`rounded-full border px-3 py-1 text-sm ${
            !category
              ? "border-[#131921] bg-[#131921] text-white"
              : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={searchHref(q, c, sort)}
            className={`rounded-full border px-3 py-1 text-sm ${
              category === c
                ? "border-[#131921] bg-[#131921] text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500">Sort by:</span>
        {SORTS.map((s) => (
          <Link
            key={s}
            href={searchHref(q, category, s)}
            className={
              sort === s
                ? "font-semibold text-[#c7511f]"
                : "text-[#007185] hover:underline"
            }
          >
            {SORT_LABELS[s]}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-md border border-zinc-200 bg-white p-10 text-center">
          <p className="text-lg font-medium text-zinc-900">
            {q ? `No results for "${q}"` : "No products found"}
            {category ? ` in ${category}` : ""}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Try a different search term or category.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-md bg-[#febd69] px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-[#f3a847]"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
