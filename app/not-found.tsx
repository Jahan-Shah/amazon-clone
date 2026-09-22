import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mt-6 rounded-md border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
