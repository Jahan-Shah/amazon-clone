import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Skeleton className="h-8 w-36" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="rounded-md border border-zinc-200 bg-white"
          >
            <div className="flex items-center gap-8 border-b border-zinc-200 px-4 py-3">
              <div>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-1 h-4 w-20" />
              </div>
              <div>
                <Skeleton className="h-3 w-10" />
                <Skeleton className="mt-1 h-4 w-14" />
              </div>
              <Skeleton className="ml-auto h-5 w-24 rounded-full" />
            </div>
            <div className="space-y-3 px-4 py-3">
              {Array.from({ length: 2 }, (_, j) => (
                <div key={j} className="flex gap-3">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-10" />
                  </div>
                  <Skeleton className="h-4 w-12 shrink-0" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
