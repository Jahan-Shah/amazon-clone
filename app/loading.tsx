import { Skeleton } from "@/components/skeleton";

function CardSkeleton() {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <Skeleton className="aspect-[4/3] w-full rounded-sm" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-2 h-5 w-1/4" />
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Skeleton className="h-7 w-32" />
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-10 flex items-baseline justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
