"use client";

import Link from "next/link";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mt-6 rounded-md border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          An unexpected error occurred. You can try again or head back to the
          store.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="text-sm font-medium text-[#007185] hover:text-[#c7511f] hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
