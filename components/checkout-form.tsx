"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getCartProducts } from "@/app/cart/actions";
import {
  startCheckout,
  type AddressField,
  type CheckoutAddressInput,
} from "@/app/checkout/actions";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type CartProduct = Awaited<ReturnType<typeof getCartProducts>>[number];

const EMPTY_ADDRESS: CheckoutAddressInput = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
};

const FIELDS: { name: AddressField; label: string; required: boolean }[] = [
  { name: "line1", label: "Street address", required: true },
  { name: "line2", label: "Apt, suite, etc. (optional)", required: false },
  { name: "city", label: "City", required: true },
  { name: "state", label: "State", required: true },
  { name: "zip", label: "ZIP code", required: true },
];

function AddressInput({
  name,
  label,
  required,
  value,
  error,
  onChange,
}: {
  name: AddressField;
  label: string;
  required: boolean;
  value: string;
  error?: string;
  onChange: (name: AddressField, value: string) => void;
}) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        value={value}
        maxLength={name === "state" ? 2 : 100}
        autoComplete={
          name === "line1"
            ? "address-line1"
            : name === "line2"
              ? "address-line2"
              : name === "city"
                ? "address-level2"
                : name === "state"
                  ? "address-level1"
                  : "postal-code"
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-[#007185] focus:outline-none aria-[invalid=true]:border-red-500"
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function PaymentSection({
  orderId,
  totalCents,
}: {
  orderId: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function pay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setMessage(submitError.message ?? "Check your payment details");
      setPaying(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
      },
    });
    if (error) {
      setMessage(error.message ?? "Payment failed. Try another card.");
      setPaying(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <PaymentElement />
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={pay}
        disabled={!stripe || paying}
        className="w-full rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {paying ? "Processing..." : `Pay ${formatPrice(totalCents)}`}
      </button>
    </div>
  );
}

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<CartProduct[] | null>(null);
  const [address, setAddress] = useState<CheckoutAddressInput>(EMPTY_ADDRESS);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<AddressField, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [payment, setPayment] = useState<{
    clientSecret: string;
    orderId: string;
  } | null>(null);

  const ids = Object.keys(items).sort().join(",");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const idList = ids ? ids.split(",") : [];
    let stale = false;
    getCartProducts(idList).then((rows) => {
      if (!stale) setProducts(rows);
    });
    return () => {
      stale = true;
    };
  }, [mounted, ids]);

  if (!mounted || products === null) {
    return <p className="mt-6 text-sm text-zinc-500">Loading checkout...</p>;
  }

  const lines = products
    .map((p) => ({ product: p, qty: items[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  if (lines.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-zinc-200 bg-white p-8 text-center">
        <p className="text-lg font-medium text-zinc-900">
          Your cart is empty
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00]"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const total = lines.reduce(
    (sum, l) => sum + l.product.priceCents * l.qty,
    0,
  );

  function updateAddress(name: AddressField, value: string) {
    setAddress((a) => ({ ...a, [name]: value }));
    setFieldErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function beginPayment(e: React.FormEvent) {
    e.preventDefault();
    setStarting(true);
    setError(null);
    setFieldErrors({});

    try {
      const result = await startCheckout({
        address,
        items: lines.map((l) => ({ productId: l.product.id, qty: l.qty })),
      });
      if (result.success) {
        setPayment(result.data);
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  const addressSummary = [
    address.line1,
    address.line2,
    `${address.city}, ${address.state.toUpperCase()} ${address.zip}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={beginPayment}
        className="h-fit rounded-md border border-zinc-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-900">
          Shipping address
        </h2>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {payment ? (
          <p className="mt-4 text-sm text-zinc-700">{addressSummary}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {FIELDS.map((f) => (
              <AddressInput
                key={f.name}
                {...f}
                value={address[f.name]}
                error={fieldErrors[f.name]}
                onChange={updateAddress}
              />
            ))}
            {stripePromise ? (
              <button
                type="submit"
                disabled={starting}
                className="w-full rounded-full bg-[#ffd814] px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-[#f7ca00] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? "Preparing payment..." : "Continue to payment"}
              </button>
            ) : (
              <p role="alert" className="text-sm text-red-600">
                Payments are not configured. Missing publishable key.
              </p>
            )}
          </div>
        )}
        {payment && stripePromise && (
          <div className="mt-6 border-t border-zinc-200 pt-6">
            <h2 className="text-lg font-semibold text-zinc-900">Payment</h2>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret: payment.clientSecret }}
            >
              <PaymentSection
                orderId={payment.orderId}
                totalCents={total}
              />
            </Elements>
          </div>
        )}
      </form>
      <aside className="h-fit rounded-md border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Order summary</h2>
        <ul className="mt-3 space-y-3">
          {lines.map(({ product, qty }) => (
            <li key={product.id} className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-zinc-100">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs text-zinc-900">
                  {product.title}
                </p>
                <p className="text-xs text-zinc-500">Qty {qty}</p>
              </div>
              <div className="shrink-0 text-xs font-medium text-zinc-900">
                {formatPrice(product.priceCents * qty)}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3">
          <span className="text-sm text-zinc-700">Order total</span>
          <span className="text-lg font-semibold text-zinc-900">
            {formatPrice(total)}
          </span>
        </div>
      </aside>
    </div>
  );
}
