import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-10">
      <div className="rounded-md border border-zinc-200 bg-white p-6">
        <Skeleton className="h-7 w-20" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-1 h-9 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
      </div>
    </main>
  );
}
