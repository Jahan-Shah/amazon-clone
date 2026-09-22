"use server";

import { getProductsByIds } from "@/lib/products";

export async function getCartProducts(ids: string[]) {
  const products = await getProductsByIds(ids);
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.images[0],
    priceCents: p.priceCents,
  }));
}
