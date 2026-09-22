"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCartProducts } from "@/app/cart/actions";
import { CartSkeleton } from "@/components/cart-skeleton";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

type CartProduct = Awaited<ReturnType<typeof getCartProducts>>[number];

export function CartView() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<CartProduct[] | null>(null);

  const ids = Object.keys(items).sort().join(",");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const idList = ids ? ids.split(",") : [];
    let stale = false;
    getCartProducts(idList).then((rows) => {
      if (!stale) setProducts(rows);
    });
    return () => {
      stale = true;
    };
  }, [mounted, ids]);

  if (!mounted || products === null) {
    return <CartSkeleton />;
  }

  const lines = products
    .map((p) => ({ product: p, qty: items[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  if (lines.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-zinc-200 bg-white p-8 text-center">
        <p className="text-lg font-medium text-zinc-900">
          Your cart is empty
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.priceCents * l.qty,
    0,
  );
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <ul className="space-y-4">
        {lines.map(({ product, qty }) => (
          <li
            key={product.id}
            className="flex gap-4 rounded-md border border-zinc-200 bg-white p-4"
          >
            <Link
              href={`/product/${product.slug}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-zinc-100"
            >
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${product.slug}`}
                className="line-clamp-2 text-sm font-medium text-zinc-900 hover:text-[#c7511f]"
              >
                {product.title}
              </Link>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-md border border-zinc-300">
                  <button
                    type="button"
                    onClick={() => setQty(product.id, qty - 1)}
                    disabled={qty <= 1}
                    aria-label="Decrease quantity"
                    className="px-2.5 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
                  >
                    -
                  </button>
                  <span className="min-w-8 px-2 text-center text-sm text-zinc-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(product.id, qty + 1)}
                    aria-label="Increase quantity"
                    className="px-2.5 py-1 text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  className="text-sm text-[#007185] hover:text-[#c7511f] hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-base font-semibold text-zinc-900">
                {formatPrice(product.priceCents * qty)}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {formatPrice(product.priceCents)} each
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-md border border-zinc-200 bg-white p-4">
        <div className="text-sm text-zinc-700">
          Subtotal ({count} {count === 1 ? "item" : "items"})
        </div>
        <div className="mt-1 text-xl font-semibold text-zinc-900">
          {formatPrice(subtotal)}
        </div>
        <Link
          href="/checkout"
          className="mt-4 block rounded-full bg-[#ffd814] px-6 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
        >
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
