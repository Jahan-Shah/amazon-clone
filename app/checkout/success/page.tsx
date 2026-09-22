import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ClearCart } from "@/components/clear-cart";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackURL=/checkout");
  }

  const { order: orderId, redirect_status: redirectStatus } =
    await searchParams;
  const id = Array.isArray(orderId) ? orderId[0] : orderId;
  if (!id) notFound();

  const order = await db.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: { include: { product: true } },
      address: true,
    },
  });
  if (!order) notFound();

  const paid = order.status === "paid";
  const failed = !paid && redirectStatus === "failed";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      {!failed && <ClearCart />}
      <div className="rounded-md border border-zinc-200 bg-white p-6">
        {paid ? (
          <>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Order placed, thank you!
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Confirmation for order{" "}
              <span className="font-medium text-zinc-900">#{order.id}</span>
            </p>
          </>
        ) : failed ? (
          <>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Payment didn&apos;t go through
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Order{" "}
              <span className="font-medium text-zinc-900">#{order.id}</span>{" "}
              was not charged. Return to checkout to try again.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Confirming your payment
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Order{" "}
              <span className="font-medium text-zinc-900">#{order.id}</span>{" "}
              was received. This page updates once the payment is confirmed.
            </p>
          </>
        )}

        <ul className="mt-6 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
                <Image
                  src={item.product.images[0]}
                  alt={item.product.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm text-zinc-900">
                  {item.product.title}
                </p>
                <p className="text-xs text-zinc-500">Qty {item.quantity}</p>
              </div>
              <div className="shrink-0 text-sm font-medium text-zinc-900">
                {formatPrice(item.priceCents * item.quantity)}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-zinc-200 pt-3 text-sm text-zinc-700">
          <p>
            Ship to: {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""},{" "}
            {order.address.city}, {order.address.state} {order.address.zip}
          </p>
          <p className="flex items-center justify-between">
            <span>Order total</span>
            <span className="text-lg font-semibold text-zinc-900">
              {formatPrice(order.totalCents)}
            </span>
          </p>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
