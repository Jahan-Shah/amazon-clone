import { CartSkeleton } from "@/components/cart-skeleton";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <Skeleton className="h-8 w-44" />
      <CartSkeleton />
    </main>
  );
}
