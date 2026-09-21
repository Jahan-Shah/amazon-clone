"use client";

import { useState } from "react";

import { useCart } from "@/lib/cart";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

export function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

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
    <div>
      <button
        type="button"
        onClick={() => {
          add(productId);
          setAdded(true);
        }}
        className="w-full rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
      >
        Add to Cart
      </button>
      {added && (
        <p role="status" className="mt-2 text-sm font-medium text-[#007600]">
          Added to cart
        </p>
      )}
    </div>
  );
}
