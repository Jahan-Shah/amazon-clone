"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart";

export function CartLink() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const count = mounted
    ? Object.values(items).reduce((sum, qty) => sum + qty, 0)
    : 0;

  return (
    <Link
      href="/cart"
      className="relative flex shrink-0 items-end gap-1 px-1 py-1 text-sm font-medium text-white hover:outline hover:outline-1 hover:outline-white"
    >
      <span className="relative inline-block">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <circle cx="9" cy="20" r="1.6" />
          <circle cx="17" cy="20" r="1.6" />
          <path d="M3 3h2l2.4 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L21 7H6" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-xs font-bold text-[#febd69]">
            {count}
          </span>
        )}
      </span>
      Cart
    </Link>
  );
}
