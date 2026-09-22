import { CartView } from "@/components/cart-view";

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Shopping Cart</h1>
      <CartView />
    </main>
  );
}
