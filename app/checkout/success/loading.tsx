import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="rounded-md border border-zinc-200 bg-white p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-48" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-12 shrink-0" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-zinc-200 pt-3">
          <Skeleton className="h-4 w-56" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="mt-6 h-10 w-40 rounded-full" />
      </div>
    </main>
  );
}
