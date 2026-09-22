import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <Skeleton className="aspect-[4/3] w-full rounded-md" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-sm" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-3 h-4 w-40" />
          <div className="mt-4 border-t border-zinc-200 pt-4">
            <Skeleton className="h-9 w-28" />
          </div>
          <Skeleton className="mt-3 h-4 w-20" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
      <div className="mt-12">
        <Skeleton className="h-7 w-24" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div
              key={i}
              className="rounded-md border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
