import type Stripe from "stripe";

import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return Response.json({ received: true });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const orderId = intent.metadata?.orderId;
  if (!orderId) {
    return Response.json({ error: "Missing order reference" }, { status: 400 });
  }

  try {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.totalCents !== intent.amount_received) {
      return Response.json({ error: "Order mismatch" }, { status: 400 });
    }
    if (order.status === "pending") {
      await db.order.update({
        where: { id: order.id },
        data: { status: "paid" },
      });
    }
    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
