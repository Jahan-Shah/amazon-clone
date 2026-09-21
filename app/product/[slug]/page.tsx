import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductGallery } from "@/components/product-gallery";
import { formatPrice } from "@/lib/format";
import { getProductBySlug } from "@/lib/products";

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stars = Math.round(product.rating);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} alt={product.title} />
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {product.title}
          </h1>
          <div className="mt-2 text-sm text-[#e77600]">
            {"★".repeat(stars)}
            {"☆".repeat(5 - stars)}{" "}
            <span className="text-xs text-zinc-500">
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>
          <div className="mt-4 border-t border-zinc-200 pt-4 text-3xl font-semibold text-zinc-900">
            {formatPrice(product.priceCents)}
          </div>
          <p
            className={`mt-2 text-sm font-medium ${
              product.stock > 0 ? "text-[#007600]" : "text-[#b12704]"
            }`}
          >
            {product.stock > 0 ? "In Stock" : "Out of Stock"}
          </p>
          <div className="mt-4">
            <AddToCartButton
              productId={product.id}
              disabled={product.stock === 0}
            />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-zinc-700">
            {product.description}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-900">Reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {product.reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-md border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900">
                    {review.authorName}
                  </span>
                  <span className="text-sm text-[#e77600]">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
