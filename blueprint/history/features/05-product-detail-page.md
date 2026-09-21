# Feature: Product detail page

**From build-plan:** feature 5
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/product-detail-page`

## Goal

Deliver `/product/[slug]`: image gallery, title, star rating + count, price,
stock state, description, seeded read-only reviews, and a working add-to-cart
button backed by the persisted cart store that feature 6 builds its UI on.

## In scope

- `lib/products.ts` - `getProductBySlug(slug)` returning the product with its
  `reviews` included (`findUnique` on the unique `slug`)
- `pnpm add zustand` + `lib/cart.ts` - minimal persisted cart store: the seam
  feature 6 extends (see Data / contracts)
- `app/product/[slug]/page.tsx` - async server component, `await params`,
  `notFound()` on unknown slug
- `components/product-gallery.tsx` - client component: main image + thumbnail
  selection across `product.images` (seed data has exactly 2 per product)
- `components/add-to-cart-button.tsx` - client component wired to the cart
  store; disabled when `stock === 0`; inline "Added to cart" confirmation
- Stock states: `stock > 0` renders "In Stock"; `stock === 0` renders "Out of
  Stock" and disables the button
- Reviews section: `authorName`, unicode stars, `body`; "No reviews yet" when
  the relation is empty (schema allows it even though seeds always have 2-4)

## Out of scope

- `/cart` page, cart line-item management, header cart badge/count
  (feature 6) - no cart navigation link from this page
- Quantity selector on the detail page - `add` increments by 1; quantity
  editing lives in feature 6's cart UI
- Review submission or any auth on this page (reviews are seeded, read-only)
- Breadcrumbs, related products/recommendations, Q&A (v1 cuts)
- Custom `not-found.tsx` / `loading.tsx` / error boundaries (feature 10);
  `notFound()` uses the default Next 404

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Queries + cart store: add `getProductBySlug(slug)` (product +
  `reviews` include) to `lib/products.ts`; `pnpm add zustand`; create
  `lib/cart.ts` with the persisted store below.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean; a `tsx`
  probe shows `getProductBySlug` returns a seeded product with reviews for a
  known slug and `null` for a bad slug.

- [x] 2. Page + gallery: `app/product/[slug]/page.tsx` (await `params`,
  `getProductBySlug`, `notFound()` on null) rendering gallery, title, stars +
  `reviewCount`, `formatPrice(priceCents)`, stock state, description, and the
  reviews list; `components/product-gallery.tsx` with thumbnail switching.
  **Done when:** `pnpm build` compiles `/product/[slug]` (run `next typegen`
  first if `PageProps` types are missing); `pnpm lint`/`tsc` clean.

- [x] 3. Add-to-cart: `components/add-to-cart-button.tsx` (`"use client"`)
  calling `useCart.add(product.id)`; disabled + "Out of Stock" when
  `stock === 0`; after a successful add shows an inline "Added to cart"
  confirmation. Wire into the page.
  **Done when:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` clean.

- [x] 4. Final gate: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
  **Done when:** all three pass.

## Files / areas

- `lib/products.ts` - extend
- `lib/cart.ts`, `components/product-gallery.tsx`,
  `components/add-to-cart-button.tsx`, `app/product/[slug]/page.tsx` - new
- `package.json` - `zustand` dependency (declared stack: "Zustand + persist")

## Data / contracts

- **Cart store (persisted localStorage, compat boundary for feature 6):**
  `useCart` from `lib/cart.ts`, `persist(..., { name: "amazon-clone-cart" })`,
  state `{ items: Record<string, number> }` keyed by `Product.id`, and
  `add(productId)` which increments that entry by 1. No product snapshots in
  storage - feature 6 resolves line items against live catalog data.
- Slug is untrusted URL input: used only inside Prisma's parameterized
  `findUnique`; a miss calls `notFound()` (real 404, never a blank page).
- Reviews render in stored order - `Review` has no timestamp field, do not
  invent sorting. Read-only; never user-submitted in v1.
- Money renders via `formatPrice` only; `priceCents` stays integer cents.
- All page data is public and read-only; no auth anywhere on this page.
- After add, the only feedback is the inline confirmation - `/cart` does not
  exist yet, so no link to it.

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is per-step commands plus `tsx` probes on
`getProductBySlug`. If a runner is added later, the cart store's `add`
reducer is the in-scope pure logic.

## Notes for the AI

- Next.js 16.3.5: `params` is a `Promise` - `await` it; `next typegen` was
  needed last feature for new-route `PageProps`.
- Zustand `persist` middleware comes from `zustand/middleware`; the store and
  any component reading it must be client-side (`"use client"`).
- Reuse the card's unicode-star convention (`Math.round(rating)`, `★`/`☆`,
  `[#e77600]`).
- `next/image` with picsum is already configured in `next.config.ts`.
- Theme is light-only: `color-scheme: light` is set in `globals.css`; give any
  new form controls explicit `bg-white` + `text-zinc-900`.
- No em dashes in generated files (coding-standards).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5490,"specSha256":"e42d05663ef3779a0b96c54c603ca1d01a4ecce32c75202918f9a2f96ddf5f8e","branch":"refs/heads/feature/product-detail-page","head":"ec807407fb3f28849302ed6f6b7a4517b22f2193","baseRef":"refs/heads/main","baseCommit":"ec807407fb3f28849302ed6f6b7a4517b22f2193","sourceTree":"735efabab3feb7f6acc3885adf88381d59b36d0d","absentOptional":[]} -->
