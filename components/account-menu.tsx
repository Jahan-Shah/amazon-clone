"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function AccountMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkClass =
    "shrink-0 px-1 py-1 text-sm font-medium text-white hover:outline hover:outline-1 hover:outline-white";

  if (!mounted || isPending || !session) {
    return (
      <Link href="/login" className={linkClass}>
        <span className="block text-xs font-normal">Hello, sign in</span>
        <span className="block font-bold">Account</span>
      </Link>
    );
  }

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={linkClass}
      >
        <span className="block text-xs font-normal">
          Hello, {session.user.name}
        </span>
        <span className="block font-bold">Account</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 rounded-md border border-zinc-200 bg-white py-1 text-sm text-zinc-900 shadow-lg">
          <Link
            href="/orders"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 hover:bg-zinc-100"
          >
            Your Orders
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="block w-full px-4 py-2 text-left hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
