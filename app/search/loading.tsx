import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-20" />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="rounded-md border border-zinc-200 bg-white p-3"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-sm" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
            <Skeleton className="mt-2 h-5 w-1/4" />
          </div>
        ))}
      </div>
    </main>
  );
}
