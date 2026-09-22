"use client";

import { useState } from "react";

import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/lib/cart";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

export function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-full cursor-not-allowed rounded-full bg-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-500"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex items-center rounded-md border border-zinc-300 bg-white">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className="px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
        >
          -
        </button>
        <span className="min-w-10 px-3 text-center text-sm text-zinc-900">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          aria-label="Increase quantity"
          className="px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          add(productId, qty);
          setOpen(true);
        }}
        className="w-full rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
      >
        Add to Cart
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
