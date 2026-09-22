"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export interface CheckoutAddressInput {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export interface CheckoutItemInput {
  productId: string;
  qty: number;
}

export interface CheckoutInput {
  address: CheckoutAddressInput;
  items: CheckoutItemInput[];
}

export type AddressField = keyof CheckoutAddressInput;

export type CheckoutResult =
  | { success: true; data: { clientSecret: string; orderId: string } }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<Record<AddressField, string>>;
    };

const FIELD_LIMITS: Record<AddressField, number> = {
  line1: 100,
  line2: 100,
  city: 50,
  state: 2,
  zip: 10,
};

function validateAddress(
  input: CheckoutAddressInput,
): Partial<Record<AddressField, string>> | null {
  const errors: Partial<Record<AddressField, string>> = {};
  const trimmed = {
    line1: input.line1.trim(),
    line2: input.line2.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    zip: input.zip.trim(),
  };

  if (!trimmed.line1) errors.line1 = "Street address is required";
  if (!trimmed.city) errors.city = "City is required";
  if (!/^[A-Z]{2}$/.test(trimmed.state)) errors.state = "Use the 2-letter code";
  if (!/^\d{5}(-\d{4})?$/.test(trimmed.zip)) errors.zip = "Enter a valid ZIP";

  for (const field of Object.keys(FIELD_LIMITS) as AddressField[]) {
    if (trimmed[field].length > FIELD_LIMITS[field]) {
      errors[field] ??= "Too long";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export async function startCheckout(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Sign in to check out" };
  }

  const fieldErrors = validateAddress(input.address);
  if (fieldErrors) {
    return { success: false, error: "Check the highlighted fields", fieldErrors };
  }

  const quantities = new Map<string, number>();
  for (const item of input.items ?? []) {
    const qty = Math.floor(item.qty);
    if (typeof item.productId !== "string" || qty < 1) {
      return { success: false, error: "Your cart looks off. Refresh and try again." };
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + qty);
  }
  if (quantities.size === 0) {
    return { success: false, error: "Your cart is empty" };
  }

  const products = await db.product.findMany({
    where: { id: { in: [...quantities.keys()] } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let totalCents = 0;
  const lines: { productId: string; quantity: number; priceCents: number }[] = [];
  for (const [productId, qty] of quantities) {
    const product = byId.get(productId);
    if (!product) {
      return { success: false, error: "An item in your cart is unavailable" };
    }
    if (qty > product.stock) {
      return {
        success: false,
        error: `Only ${product.stock} left of "${product.title}"`,
      };
    }
    totalCents += product.priceCents * qty;
    lines.push({ productId, quantity: qty, priceCents: product.priceCents });
  }

  const address = {
    line1: input.address.line1.trim(),
    line2: input.address.line2.trim() || null,
    city: input.address.city.trim(),
    state: input.address.state.trim().toUpperCase(),
    zip: input.address.zip.trim(),
  };

  const order = await db.$transaction(async (tx) => {
    const saved = await tx.address.create({
      data: { userId: session.user.id, ...address },
    });
    return tx.order.create({
      data: {
        userId: session.user.id,
        addressId: saved.id,
        status: "pending",
        totalCents,
        items: { create: lines },
      },
    });
  });

  try {
    const intent = await getStripe().paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true },
    });
    if (!intent.client_secret) throw new Error("missing client secret");
    return {
      success: true,
      data: { clientSecret: intent.client_secret, orderId: order.id },
    };
  } catch {
    return {
      success: false,
      error: "Payment could not be started. Please try again.",
    };
  }
}
