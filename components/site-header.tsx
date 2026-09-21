import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 bg-[#131921] text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-white hover:outline hover:outline-1 hover:outline-white"
        >
          amazon<span className="text-[#febd69]"> clone</span>
        </Link>
        <form action="/search" method="get" className="flex min-w-0 flex-1">
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder="Search products"
            className="min-w-0 flex-1 rounded-l-md border-0 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#febd69]"
          />
          <button
            type="submit"
            className="shrink-0 rounded-r-md bg-[#febd69] px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-[#f3a847]"
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
