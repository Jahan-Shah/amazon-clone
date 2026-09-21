import { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";

export const CATEGORIES = [
  "Electronics",
  "Home",
  "Books",
  "Fashion",
  "Toys",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SORTS = [
  "featured",
  "price-asc",
  "price-desc",
  "rating",
] as const;

export type Sort = (typeof SORTS)[number];

export interface SearchParams {
  q: string;
  category?: Category;
  sort: Sort;
}

type RawParams = Record<string, string | string[] | undefined>;

export function normalizeSearchParams(raw: RawParams): SearchParams {
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = first(raw.q).trim().slice(0, 200);
  const c = first(raw.category);
  const s = first(raw.sort);
  return {
    q,
    category: (CATEGORIES as readonly string[]).includes(c)
      ? (c as Category)
      : undefined,
    sort: (SORTS as readonly string[]).includes(s) ? (s as Sort) : "featured",
  };
}

const featuredOrder: Prisma.ProductOrderByWithRelationInput[] = [
  { rating: "desc" },
  { reviewCount: "desc" },
];

export function getFeaturedProducts() {
  return db.product.findMany({ orderBy: featuredOrder, take: 8 });
}

export function getProductsByCategory(category: Category) {
  return db.product.findMany({
    where: { category },
    orderBy: featuredOrder,
    take: 4,
  });
}

export function searchProducts({ q, category, sort }: SearchParams) {
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ priceCents: "asc" }]
      : sort === "price-desc"
        ? [{ priceCents: "desc" }]
        : sort === "rating"
          ? [{ rating: "desc" }]
          : featuredOrder;

  return db.product.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy,
  });
}
