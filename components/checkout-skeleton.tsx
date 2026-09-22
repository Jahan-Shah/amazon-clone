import { Skeleton } from "@/components/skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="h-fit rounded-md border border-zinc-200 bg-white p-6">
        <Skeleton className="h-6 w-36" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1 h-9 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
      </div>
      <div className="h-fit rounded-md border border-zinc-200 bg-white p-4">
        <Skeleton className="h-4 w-24" />
        <div className="mt-3 space-y-3">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-10" />
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
