import { Skeleton } from "@/components/skeleton";

export function CartSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-md border border-zinc-200 bg-white p-4"
          >
            <Skeleton className="h-24 w-24 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-3 h-7 w-36 rounded-md" />
            </div>
            <div className="shrink-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="mt-2 h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-fit rounded-md border border-zinc-200 bg-white p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-7 w-24" />
        <Skeleton className="mt-4 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
