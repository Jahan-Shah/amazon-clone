import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { getSession } from "@/lib/session";

export default async function CheckoutPage() {
  if (!(await getSession())) {
    redirect("/login?callbackURL=/checkout");
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Checkout</h1>
      <CheckoutForm />
    </main>
  );
}
