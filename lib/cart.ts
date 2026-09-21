"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  items: Record<string, number>;
  add: (productId: string) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      add: (productId) =>
        set((state) => ({
          items: {
            ...state.items,
            [productId]: (state.items[productId] ?? 0) + 1,
          },
        })),
    }),
    { name: "amazon-clone-cart" },
  ),
);
