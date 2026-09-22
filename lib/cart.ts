"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  items: Record<string, number>;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      add: (productId, qty = 1) =>
        set((state) => {
          const delta = Math.max(1, Math.floor(qty));
          return {
            items: {
              ...state.items,
              [productId]: (state.items[productId] ?? 0) + delta,
            },
          };
        }),
      setQty: (productId, qty) =>
        set((state) => {
          const items = { ...state.items };
          if (qty < 1) {
            delete items[productId];
          } else {
            items[productId] = Math.floor(qty);
          }
          return { items };
        }),
      remove: (productId) =>
        set((state) => {
          const items = { ...state.items };
          delete items[productId];
          return { items };
        }),
      clear: () => set({ items: {} }),
    }),
    { name: "amazon-clone-cart" },
  ),
);
