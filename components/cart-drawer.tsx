"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getCartProducts } from "@/app/cart/actions";
import { Skeleton } from "@/components/skeleton";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

type CartProduct = Awaited<ReturnType<typeof getCartProducts>>[number];

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const [products, setProducts] = useState<CartProduct[] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const ids = Object.keys(items).sort().join(",");

  useEffect(() => {
    if (!open) return;
    const idList = ids ? ids.split(",") : [];
    let stale = false;
    getCartProducts(idList).then((rows) => {
      if (!stale) setProducts(rows);
    });
    return () => {
      stale = true;
    };
  }, [open, ids]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const lines = (products ?? [])
    .map((p) => ({ product: p, qty: items[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);
  const subtotal = lines.reduce(
    (sum, l) => sum + l.product.priceCents * l.qty,
    0,
  );
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2
            id="cart-drawer-title"
            className="text-base font-semibold text-[#007600]"
          >
            Added to cart
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm px-2 py-1 text-xl leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {products === null ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-1.5 h-6 w-32 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-10 shrink-0" />
                </div>
              ))}
            </div>
          ) : lines.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-zinc-900">
                Your cart is empty
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 text-sm font-medium text-[#007185] hover:text-[#c7511f] hover:underline"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-zinc-900">
                      {product.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="flex items-center rounded-md border border-zinc-300">
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty - 1)}
                          disabled={qty <= 1}
                          aria-label="Decrease quantity"
                          className="px-2 py-0.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
                        >
                          -
                        </button>
                        <span className="min-w-7 px-1 text-center text-sm text-zinc-900">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty + 1)}
                          aria-label="Increase quantity"
                          className="px-2 py-0.5 text-sm text-zinc-700 hover:bg-zinc-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(product.id)}
                        className="text-xs text-[#007185] hover:text-[#c7511f] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-medium text-zinc-900">
                    {formatPrice(product.priceCents * qty)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-zinc-200 px-4 py-4">
          <p className="flex items-center justify-between text-sm text-zinc-700">
            <span>
              Cart subtotal ({count} {count === 1 ? "item" : "items"})
            </span>
            <span className="text-lg font-semibold text-zinc-900">
              {formatPrice(subtotal)}
            </span>
          </p>
          <Link
            href="/checkout"
            onClick={onClose}
            className="mt-3 block rounded-full bg-[#ffd814] px-6 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/cart"
            onClick={onClose}
            className="mt-2 block rounded-full border border-zinc-300 px-6 py-2.5 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            View cart
          </Link>
        </div>
      </div>
    </div>
  );
}
