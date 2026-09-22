import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OrderStatus } from "@/components/order-status";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";
import { getSession } from "@/lib/session";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackURL=/orders");
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            You haven&apos;t placed any orders yet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-md border border-zinc-200 bg-white"
            >
              <div className="flex flex-wrap items-center gap-x-8 gap-y-1 border-b border-zinc-200 px-4 py-3">
                <div>
                  <span className="block text-xs text-zinc-500">
                    Order placed
                  </span>
                  <span className="text-sm font-medium text-zinc-900">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Total</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {formatPrice(order.totalCents)}
                  </span>
                </div>
                <div className="ml-auto">
                  <OrderStatus status={order.status} />
                </div>
              </div>

              <ul className="space-y-3 px-4 py-3">
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
                        Qty {item.quantity}
                      </p>
                    </div>
                    <div className="shrink-0 text-sm font-medium text-zinc-900">
                      {formatPrice(item.priceCents * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
                <span className="text-xs text-zinc-500">
                  Order #{order.id}
                </span>
                <Link
                  href={`/orders/${order.id}`}
                  className="text-sm font-medium text-[#007185] hover:text-[#c7511f] hover:underline"
                >
                  View order details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
