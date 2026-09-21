import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";

interface ProductCardProps {
  product: {
    slug: string;
    title: string;
    images: string[];
    rating: number;
    reviewCount: number;
    priceCents: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const stars = Math.round(product.rating);
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col rounded-md border border-zinc-200 bg-white p-3 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-zinc-100">
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-medium text-zinc-900 group-hover:text-[#c7511f]">
        {product.title}
      </h3>
      <div className="mt-1 text-sm text-[#e77600]">
        {"★".repeat(stars)}
        {"☆".repeat(5 - stars)}{" "}
        <span className="text-xs text-zinc-500">({product.reviewCount})</span>
      </div>
      <div className="mt-1 text-base font-semibold text-zinc-900">
        {formatPrice(product.priceCents)}
      </div>
    </Link>
  );
}
