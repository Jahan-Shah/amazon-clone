# Feature: Cart

**From build-plan:** feature 6
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/cart`

## Goal

Deliver `/cart`: a guest cart page reading the persisted `useCart` store -
line items with images and prices, quantity controls, remove, subtotal, a
designed empty state - plus a header cart link with a live count badge so the
page is reachable.

## In scope

- `lib/cart.ts` - extend the store: `setQty(productId, qty)` and
  `remove(productId)` alongside the existing `items` + `add`
- `lib/products.ts` - `getProductsByIds(ids)` (`findMany` `id in ids`)
- `app/cart/actions.ts` - `"use server"` action `getCartProducts(ids)` that
  resolves cart ids to live catalog rows via `getProductsByIds`
- `app/cart/page.tsx` - server component rendering the client cart view
- `components/cart-view.tsx` - client component: mounted gate, reads `items`,
  calls the action, renders line items (thumbnail, title link to
  `/product/[slug]`, unit price, qty stepper, remove), subtotal, "Proceed to
  checkout" link, designed empty state
- `components/cart-link.tsx` + `site-header.tsx` - client badge showing total
  item count, linked to `/cart`
- Quantity stepper: `-` disabled at qty 1; `setQty` with qty < 1 removes the
  entry; separate "Remove" per line
- Stale localStorage ids (product no longer in catalog): skipped in render

## Out of scope

- `/checkout` itself (feature 8) - the "Proceed to checkout" link points at
  `/checkout` and 404s until then, same dead-link contract as before
- `clear()` on the store - checkout (feature 8) adds it when it needs it
- Stock-capping quantities - quantity controls are unbounded by `stock` in v1
- Merging a guest cart into an account cart (feature 7+ has no such contract)
- Tax/shipping/order totals - subtotal only
- Auth anywhere on `/cart` - guests cart freely per the overview

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Store + queries: add `setQty` and `remove` to `useCart` in
  `lib/cart.ts`; add `getProductsByIds(ids)` to `lib/products.ts`; create
  `app/cart/actions.ts` with `"use server"` `getCartProducts(ids)`.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean; a `tsx`
  probe shows `getProductsByIds` returns seeded rows for known ids.

- [x] 2. Cart page + view: `app/cart/page.tsx` (server) rendering
  `components/cart-view.tsx` (client): after mount reads `items`, calls
  `getCartProducts`, renders the line list, stepper, remove, subtotal via
  `formatPrice`, checkout link, and the empty state when `items` is empty.
  **Done when:** `pnpm build` compiles `/cart` (run `next typegen` if route
  types are missing); `pnpm lint`/`tsc` clean.

- [x] 3. Header entry point: `components/cart-link.tsx` (client) - cart link
  with a count badge summing `items` quantities, mounted-gated like the view;
  wire into `site-header.tsx`.
  **Done when:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` clean.

- [x] 4. Final gate: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
  **Done when:** all three pass.

## Files / areas

- `lib/cart.ts`, `lib/products.ts` - extend
- `app/cart/page.tsx`, `app/cart/actions.ts`,
  `components/cart-view.tsx`, `components/cart-link.tsx` - new
- `components/site-header.tsx` - add the cart link

## Data / contracts

- Store shape stays `{ items: Record<productId, number> }` under
  `persist` name `amazon-clone-cart` - the feature-5 contract. New actions:
  `setQty(productId, qty)` (qty < 1 removes the entry; integers only) and
  `remove(productId)`. No product snapshots in storage.
- Product resolution: client sends ids to the server action; server returns
  live catalog fields (`id`, `slug`, `title`, `images[0]`, `priceCents`).
  ids are untrusted input - used only inside Prisma's parameterized
  `findMany`; unknown ids are simply absent from the result and skipped.
- Subtotal = sum of `priceCents * qty` over resolved items, rendered with
  `formatPrice`; prices are live catalog values, not add-time snapshots.
- Header badge = total quantity across all lines; hidden at 0.
- Persisted store + SSR: client components read `items` only after mount
  (`useState`/`useEffect` gate) so server and first client render match -
  cart contents never render into SSR'd HTML.
- `/cart` is public; no auth. Checkout link targets `/checkout` (404 until
  feature 8).

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is per-step commands plus a `tsx` probe on
`getProductsByIds`. If a runner is added later, `setQty`/`remove` reducers
are the in-scope pure logic.

## Notes for the AI

- `useCart` is `"use client"` module state; `app/cart/page.tsx` stays a
  server component and only composes the client view.
- Server action: file-level `"use server"` in `app/cart/actions.ts`; call it
  from the client view like an async function - no manual fetch/route.
- Keep the Amazon look: qty stepper as small bordered controls, "Remove" as
  a text link, checkout as the yellow `[#ffd814]` pill.
- Reuse `formatPrice`, `next/image` (picsum configured), unicode stars not
  needed here.
- No em dashes in generated files (coding-standards).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5425,"specSha256":"5695c0e953cd361f5918bbd5745713138b3d99d7e99a0305346f8a40b7f0a58b","branch":"refs/heads/feature/cart","head":"60986e16cb524e126e3b6b17a9e104d27f7e514a","baseRef":"refs/heads/main","baseCommit":"60986e16cb524e126e3b6b17a9e104d27f7e514a","sourceTree":"adc7582bf909501cf47569c8604998281fa10d4e","absentOptional":[]} -->
