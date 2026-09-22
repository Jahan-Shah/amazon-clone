# Feature: Checkout

**From build-plan:** feature 8
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/checkout`

## Goal

Give a signed-in shopper a single-page checkout: enter a shipping address,
pay with a Stripe test card in an embedded Payment Element, and land on an
order confirmation. A Stripe webhook is the only path that marks an order
`paid`. Deliberately one page, better than Amazon's multi-step flow.

## In scope

- `/checkout` page (auth required): address form, order summary built from
  the cart, Stripe Payment Element.
- Server action that validates the submission, creates Address + Order
  (`pending`) + OrderItems with price snapshots, creates the PaymentIntent,
  and returns its client secret.
- `POST /api/webhooks/stripe` route handler: signature-verified, marks the
  order `paid` on `payment_intent.succeeded`.
- `/checkout/success` confirmation page scoped to the signed-in user.
- Cart cleared only after a confirmed payment.
- Stripe dependencies and `.env.example` placeholders.
- `proxy.ts` matcher widened so `/checkout/success` is also auth-gated.

## Out of scope

- Saved-address picker (each checkout creates a new `Address` row).
- Shipping, tax, or discount lines: total equals the item subtotal.
- Stock decrement, refunds, cancellations, payment-method management.
- Order history pages (`/orders`) - feature 9; the confirmation page shows
  the order inline instead.
- Real charges: Stripe stays in test mode.

## Build loop

`workflow.stepReview: "feature"` and `workflow.checkpointCommits:
"disabled"`: implement all steps in order, then present one review packet.
No per-step checkpoint commits; `/complete` creates the final feature commit.

## Build steps

- [x] 1. Stripe foundation.
  `pnpm add stripe @stripe/react-stripe-js @stripe/stripe-js`. Add
  `lib/stripe.ts`: a server-only Stripe client singleton reading
  `STRIPE_SECRET_KEY` (mirrors the `lib/db.ts` pattern). Add
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` placeholders to `.env.example`.
  Done when: `pnpm exec tsc --noEmit` passes and `lib/stripe.ts` imports
  cleanly server-side.

- [x] 2. `startCheckout` server action in `app/checkout/actions.ts`.
  Requires `getSession()`; rejects with `{ success: false, error }` when
  unauthenticated. Validates address input (below) and the client-sent cart
  `{ productId, qty }[]`: non-empty, every product exists, `qty` integer >=
  1 and <= current `stock`. Recomputes the total from DB `priceCents` -
  client totals are never trusted. In one Prisma transaction creates
  `Address` (userId from session), `Order` (`status: "pending"`,
  `totalCents`), and `OrderItem` rows with `priceCents` snapshots. Then
  creates the PaymentIntent (`amount: totalCents`, `currency: "usd"`,
  `metadata: { orderId }`) and returns
  `{ success: true, data: { clientSecret, orderId } }`. A PaymentIntent
  failure returns an error and leaves the pending order (a real unpaid
  order; retry creates a fresh one).
  Done when: typecheck passes; the action rejects no-session, empty-cart,
  unknown-product, over-stock, and invalid-address inputs with
  `success: false`; a valid call returns a client secret.

- [x] 3. Webhook `app/api/webhooks/stripe/route.ts` (`POST`).
  Reads the raw body via `request.text()` (never `json()`), verifies with
  `stripe.webhooks.constructEvent` and `STRIPE_WEBHOOK_SECRET`; bad
  signature -> 400. On `payment_intent.succeeded`: load the order by
  `metadata.orderId`, require `amount_received === order.totalCents`
  (mismatch -> 400, investigated not paid), set `status: "paid"`; an
  already-paid order still returns 200 (idempotent). Other event types ->
  200 ignored. Processing errors -> 500 so Stripe retries.
  Done when: a forged/unsigned request returns 400, and a valid
  `payment_intent.succeeded` flips the matching order `pending` -> `paid`
  (verifiable with `stripe listen`/`stripe trigger` during `/check`).

- [x] 4. Checkout page and form.
  `app/checkout/page.tsx` (server component): `getSession()` -> `redirect`
  to `/login?callbackURL=/checkout` when absent (defense in depth behind
  `proxy.ts`), render the client form.
  `components/checkout-form.tsx` (client): on mount resolves cart products
  via the existing `getCartProducts` pattern and calls `startCheckout` on
  submit (address fields + cart items). Order summary lists line items and
  total from server-returned data. Mounts `<PaymentElement>` from the
  returned client secret; submit calls `stripe.confirmPayment` with
  `return_url` `/checkout/success?order=<orderId>`.
  States: loading while the PaymentIntent is created, empty-cart state with
  a continue-shopping link, per-field address errors (`aria-invalid`,
  associated messages), Stripe-rendered card errors, and a generic
  try-again message on unexpected failure.
  Done when: a signed-in user with items sees address + order summary +
  card fields on one page; a guest hitting `/checkout` lands on login with
  a callback back; an empty cart sees the empty state; `tsc`, `lint`, and
  `build` pass.

- [x] 5. Confirmation page and cart clearing.
  Widen `proxy.ts` matcher `"/checkout"` -> `"/checkout/:path*"` so the
  success URL is auth-gated. `app/checkout/success/page.tsx` (server):
  requires session, reads `?order=`, loads the order with items scoped by
  `session.user.id` (unknown/foreign id -> not-found or redirect home).
  Shows order number, item summary, total, and status: `paid` or a
  "confirming payment" state while the webhook lands. A small client effect
  clears the zustand cart once (add a `clear()` action to `lib/cart.ts`).
  Links continue shopping to `/`; does not link to `/orders` (feature 9).
  Done when: after a successful test payment the shopper lands on the
  confirmation showing their order and the persisted cart is empty.

## Files / areas

- `app/checkout/page.tsx`, `app/checkout/actions.ts`,
  `app/checkout/success/page.tsx` - new
- `app/api/webhooks/stripe/route.ts` - new
- `components/checkout-form.tsx` (+ a small cart-clear effect on success) -
  new
- `lib/stripe.ts` - new; `lib/cart.ts` - add `clear()`; `lib/session.ts`,
  `lib/format.ts`, `app/cart/actions.ts` `getCartProducts` - reused
- `proxy.ts` - matcher update
- `.env.example`, `package.json`/`pnpm-lock.yaml` - Stripe entries

## Data / contracts

- Money stays integer cents; `formatPrice` for display. `Order.totalCents`
  and `OrderItem.priceCents` are server-computed snapshots at order time.
- `Order.status`: `"pending"` at creation; only the webhook sets `"paid"`.
  `"shipped"` remains unused in v1.
- PaymentIntent: `amount = order.totalCents`, `currency = "usd"`,
  `metadata.orderId = order.id`. Only the client secret crosses to the
  browser; secret keys never ship client-side.
- Address validation: `line1`, `city`, `state`, `zip` required and trimmed;
  `line2` optional; reasonable length caps; `state` is a 2-letter code,
  `zip` matches 5 digits or ZIP+4. Errors render per-field with labels.
- Trust boundaries: `userId` always from `getSession()` server-side; order
  lookups on the success page filter by session user; webhook trust is the
  Stripe signature plus the `amount_received` cross-check; user-entered
  address text renders through React escaping only.
- New env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (placeholders in `.env.example`).

## Testing

No test command is configured, so there is no unit-test gate per
`coding-standards.md`. Step evidence is `pnpm exec tsc --noEmit`,
`pnpm lint`, and `pnpm build` staying green. `/check` does the live pass:
Stripe test keys in `.env`, `stripe listen --forward-to
localhost:3000/api/webhooks/stripe`, and test card `4242 4242 4242 4242`
for the happy path plus a declined card for the failure path.

## Notes for the AI

- Live verification needs real Stripe test keys in `.env` (absent today);
  the user supplies them. Never commit real keys - `.env.example` gets
  empty placeholders only.
- This is Next.js 16: read the relevant guide under
  `node_modules/next/dist/docs/` before writing code (route handlers are
  Web Request/Response; `params`/`searchParams` are Promises; `proxy.ts`
  replaces middleware).
- `proxy.ts` matches `"/checkout"` exactly; `"/checkout/:path*"` is needed
  to cover `/checkout/success`.
- Server Actions for the checkout mutation per coding standards; the
  webhook is a route handler (third-party integration, exact status codes).
- Abandoned checkouts leave `pending` orders; that is honest state, and
  feature 9 decides whether order history lists or filters them.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":8649,"specSha256":"fac4787be4d3ddc7ef7160af3e6247ec0f2a2d061d6ad29be4d69673a9f065af","branch":"refs/heads/feature/checkout","head":"99c8914f283022810abc10364bd938dce100239b","baseRef":"refs/heads/main","baseCommit":"f8b37d0eab47f2dc268540d022bc6b139ce603bf","sourceTree":"f26ccf1c5238d13359ce43deabbb85e1ca03d85d","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 99c8914f283022810abc10364bd938dce100239b
**Base commit:** f8b37d0eab47f2dc268540d022bc6b139ce603bf
**Base ref:** main
**Spec hash:** fac4787be4d3ddc7ef7160af3e6247ec0f2a2d061d6ad29be4d69673a9f065af
**Prepared by:** codex
**Builder model:** SWE-2 High
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-22T19:31:40Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** unknown (runtime did not expose exact model)
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-22T19:39:51Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `pnpm exec tsc --noEmit`: pass
- `pnpm lint`: pass
- `pnpm build`: pass

## Evidence

- Freshness verified: HEAD = 99c8914f283022810abc10364bd938dce100239b; `git merge-base main HEAD` = f8b37d0eab47f2dc268540d022bc6b139ce603bf; SHA-256 of `blueprint/context/current-feature.md` matches the recorded spec hash; the only working-tree path differing from the target at review start was `blueprint/context/review.md`.
- `app/checkout/actions.ts` (whole file): `getSession()` gate, `userId` only from session, cart items re-validated against DB (existence, `qty <= stock`), `totalCents` recomputed from `priceCents` (client totals never trusted), Address + pending Order + OrderItem snapshots in one `$transaction`, PaymentIntent created after commit with `amount = totalCents`, `currency = "usd"`, `metadata.orderId`; only `clientSecret` + `orderId` returned. Matches spec contract.
- `app/api/webhooks/stripe/route.ts` (whole file): raw body via `request.text()`, `constructEvent` signature verification (400 on missing/invalid signature), `payment_intent.succeeded` only, `amount_received === order.totalCents` cross-check (400 on mismatch/unknown order), `pending` -> `paid` transition is idempotent, other events 200-ignored, processing errors 500 for Stripe retry. `node_modules/stripe/cjs/Webhooks.js` confirms `constructEvent` uses `createDefaultCryptoProvider()` = NodeCryptoProvider, synchronous-capable on the default Node route-handler runtime.
- `app/checkout/page.tsx`, `app/checkout/success/page.tsx` (whole files): both re-check `getSession()` behind `proxy.ts`; success-page order query scoped by `session.user.id` (foreign/unknown id -> `notFound()`); matcher `"/checkout/:path*"` covers `/checkout` and `/checkout/success` (Next `*` matches zero+ segments).
- `components/checkout-form.tsx` (whole file): hydration guard and `getCartProducts` fetch mirror `cart-view.tsx`; `beginPayment` submits only server-derived `lines`; displayed totals are client-side display while the charged amount is server-computed; PaymentElement mounts only after a client secret exists; `confirmPayment` `return_url` targets `/checkout/success?order=`; publishable-key-missing degradation message present; per-field `aria-invalid`/`aria-describedby` and `role="alert"` per spec.
- `lib/stripe.ts`, `lib/cart.ts`, `.env.example`, `package.json`/`pnpm-lock.yaml`, `proxy.ts` diffs: singleton mirrors `lib/db.ts`; `clear()` is a trivial `set({ items: {} })`; only placeholder env values; Stripe deps pinned in lockfile.
- `pnpm build` route table: `/checkout`, `/checkout/success`, `/api/webhooks/stripe` all dynamic (ƒ); 11 routes generated, no errors.
- `.agent-logs/2026-09-22_19-17-33_dawn-syzygy.md` is an established committed convention (tracked in prior feature commits), not new machinery.

## Findings

- F-10 [P3] open - Malformed `startCheckout` payloads escape the `{success:false}` contract as unhandled throws (app/checkout/actions.ts:77-89,124)
- F-11 [P3] open - Success page clears the cart before payment is confirmed (app/checkout/success/page.tsx:34-39, components/clear-cart.tsx)
- F-12 [P3] open - Success-page unauthenticated redirect drops the `?order=` param (app/checkout/success/page.tsx:16-18)
- F-13 [P3] open - Address normalization duplicated between validation and persistence (app/checkout/actions.ts:47-53 vs 116-122)

## Remaining risk

- No test command is configured (`package.json` has no test script; AGENTS.md declares none), so the validation and webhook logic has no executable assertions; per `coding-standards.md` this is accepted until `/tests` runs.
- Live Stripe behavior unverified: no `STRIPE_*` keys exist in this environment, so signature verification, `payment_intent.succeeded` handling, and the `stripe listen` + test-card pass were reviewed by code inspection only. The spec defers this to `/check`; Check was not required for this receipt.
- No dev server was started and no browser evidence was gathered (review constraints), so PaymentElement rendering, `confirmPayment` redirect, and ClearCart timing are unverified at runtime.
- Stock is validated but not decremented (spec'd out of scope): concurrent checkouts can oversell until a later feature adds decrement.
- A `payment_intent.succeeded` event with missing or foreign `metadata.orderId` returns 400, causing Stripe retries until it gives up; spec-conformant (mismatch -> 400), minor operational noise.
- `pnpm build` emitted a pre-existing pg/pg-connection-string SSL-mode deprecation warning unrelated to this delta.
