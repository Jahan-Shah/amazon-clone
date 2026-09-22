import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { OrderStatus } from "@/components/order-status";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/login?callbackURL=${encodeURIComponent(`/orders/${id}`)}`);
  }

  const order = await db.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: { include: { product: true } },
      address: true,
    },
  });
  if (!order) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link
        href="/orders"
        className="text-sm font-medium text-[#007185] hover:text-[#c7511f] hover:underline"
      >
        &larr; Back to Your Orders
      </Link>

      <div className="mt-4 rounded-md border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Order #{order.id}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
          <OrderStatus status={order.status} />
        </div>

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
                <p className="text-xs text-zinc-500">
                  Qty {item.quantity} &middot; {formatPrice(item.priceCents)}{" "}
                  each
                </p>
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
