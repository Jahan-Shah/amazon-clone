# Feature: Polish pass

**From build-plan:** feature 10
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/polish-pass`

## Goal

Final UX sweep: designed loading/not-found/error states where pages today
render blank or framework defaults, a mobile-friendly header, and the one
"better than original" bet - a slide-over mini-cart drawer on add-to-cart
that confirms the item without forcing a page navigation (Amazon pushes a
full interstitial page for this).

## In scope

- Per-route `loading.tsx` skeletons matching each page's real layout:
  home (heading + product grids), search (title + filter pills + sort +
  grid), product detail (gallery + info two-column), cart (line items +
  sidebar), checkout (form + summary), checkout success (confirmation
  card), orders list, order detail, login and signup (centered form
  card). Shared `components/skeleton.tsx` primitives (`animate-pulse`
  bars/blocks) keep them consistent.
- `app/not-found.tsx`: branded 404 ("Page not found" + continue-shopping
  link) covering bad product slugs and order ids.
- `app/error.tsx`: client error boundary with a try-again (`reset()`) and
  a home link for unexpected failures.
- `components/site-header.tsx`: two-row mobile layout - logo, account, and
  cart on row one; the search form full-width on row two below `sm`;
  unchanged single row at `sm` and up.
- `components/cart-drawer.tsx` (new, client): right-side slide-over opened
  by add-to-cart. Shows an "Added to cart" header, the cart's line items
  (image, title, qty), subtotal and item count, a "Proceed to checkout"
  link, and a "View cart" link. Each line item has a quantity stepper
  (-/+) reusing the store's `setQty` and a `Remove` link reusing `remove`,
  mirroring `cart-view.tsx` controls. Closes via X button, `Esc`, or
  backdrop click; `role="dialog"` + `aria-modal`, focus moved into the
  panel on open.
- `components/add-to-cart-button.tsx`: opens the drawer on successful add
  instead of the static "Added to cart" text.
- Verification pass that existing empty states still render (cart, empty
  orders, no search results, no reviews) - they exist; this feature does
  not rebuild them.

## Out of scope

- Body scroll-lock, focus-trap cycling beyond initial focus, or animation
  libraries - plain Tailwind transitions.
- Rebuilding existing empty states, pagination, or any new data fetching
  surface.
- Dark mode or other bets; exactly one bet ships.
- Refactoring duplicated item-row markup (tracked as finding F-14).

## Build loop

`workflow.stepReview: "feature"` and `workflow.checkpointCommits:
"disabled"`: implement all steps in order, then present one review packet.
No per-step checkpoint commits; `/complete` creates the final feature
commit.

## Build steps

- [x] 1. Route state pages.
  `app/loading.tsx`: server component rendering a `max-w-6xl` main with a
  heading bar placeholder and a `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
  grid of ~8 `animate-pulse` card skeletons (image block + text bars).
  `app/not-found.tsx`: centered card with "Page not found", brief copy,
  and a continue-shopping link to `/` styled like existing buttons.
  `app/error.tsx`: `"use client"` boundary receiving `{ error, reset }`,
  same card pattern with "Something went wrong", a `Try again` button
  calling `reset()`, and a home link.
  Done when: `tsc` and `lint` pass; the three files compile as route
  states (a bad `/product/<slug>` renders the branded 404, verified during
  `/check`).

- [x] 2. Mobile header.
  `site-header.tsx`: make the container `flex-wrap` and give the search
  form `order-last w-full sm:order-none sm:w-auto sm:flex-1` (or
  equivalent) so below `sm` the search bar drops to a full-width second
  row while logo, AccountMenu, and CartLink share row one; `sm` and up
  keeps today's single row. Keep the sticky header and existing link
  styling.
  Done when: at ~360px the header shows two rows and the search input is
  usable; at desktop widths the layout is unchanged; no horizontal
  overflow on `/`, `/search`, `/cart`, `/checkout`, `/orders`,
  `/product/[slug]` (manual check at mobile width); `tsc`, `lint` pass.

- [x] 3. Mini-cart drawer (the bet).
  `components/cart-drawer.tsx`: client component with `{ open, onClose }`.
  While open it renders a `fixed inset-0 z-50` backdrop plus a right
  `max-w-sm` slide-over panel. On open it resolves cart products via the
  existing `getCartProducts` server action (same mounted + stale-guard
  pattern as `cart-view.tsx`) and renders compact line items, item count,
  subtotal via `formatPrice`, "Proceed to checkout" -> `/checkout`, "View
  cart" -> `/cart`, and a close control. `role="dialog"`,
  `aria-modal="true"`, labelled "Added to cart"; focus moves to the close
  button on open; `Esc` and backdrop click call `onClose`.
  `add-to-cart-button.tsx`: replace the `added` flag + status text with
  `open` state; on add, `add(productId, qty)` then `setOpen(true)` and
  render the drawer.
  Done when: adding a product opens the drawer without navigating, shows
  the added item, count, and subtotal; Esc/backdrop/X close it; checkout
  and cart links navigate correctly; the header cart badge still updates;
  `tsc`, `lint`, `build` pass with no new dependencies.

- [x] 4. Per-item quantity controls in the drawer.
  In `components/cart-drawer.tsx`, pull `setQty` and `remove` from
  `useCart` and give each line item the same stepper as `cart-view.tsx`
  (bordered -/+/count, minus disabled at qty 1, `aria-label`s) plus a
  `Remove` link. Item count and subtotal update live from the store;
  removing the last item shows an empty-cart message with a continue
  link.
  Done when: +/- changes quantity and totals immediately, `Remove` drops
  the line, minus at qty 1 is disabled, and the persisted cart reflects
  the same quantities on `/cart`; `tsc`, `lint` pass.

- [x] 5. Per-route skeletons matching real layouts.
  Add `components/skeleton.tsx` exporting a small `Skeleton` block
  (`animate-pulse rounded bg-zinc-200` with a `className` passthrough).
  Replace the one-size `app/loading.tsx` with per-route `loading.tsx`
  files: `app/` (heading bar + product-card grid), `app/search/` (title
  bar + pill row + sort row + grid), `app/product/[slug]/` (two-column
  gallery + info), `app/cart/` (item rows + sidebar card), `app/checkout/`
  (form card + summary card), `app/checkout/success/` (confirmation
  card), `app/orders/` (heading + order cards), `app/orders/[id]/`
  (back link + detail card), `app/login/` and `app/signup/` (centered
  form card). Each mirrors the real page's container width and section
  shapes.
  The cart and checkout pages are static-prerendered, so their visible
  loading state is the client-side product fetch in `cart-view.tsx` and
  `checkout-form.tsx` (today plain "Loading..." text), not the route
  file. Extract `components/cart-skeleton.tsx` (item rows + sidebar) and
  `components/checkout-skeleton.tsx` (form + summary cards) and reuse
  them in both the route `loading.tsx` files and those components;
  `cart-drawer.tsx` gets matching skeleton item rows in place of its
  loading text.
  Done when: every route's loading state resembles its page (no generic
  grid on detail/checkout/orders pages), and `/cart`, `/checkout`, and
  the drawer show skeleton layouts instead of text while cart products
  resolve; `tsc`, `lint`, `build` pass.

## Files / areas

- `app/not-found.tsx`, `app/error.tsx` - new
- `app/loading.tsx` plus per-route `loading.tsx` under `app/search/`,
  `app/product/[slug]/`, `app/cart/`, `app/checkout/` (and `success/`),
  `app/orders/` (and `[id]/`), `app/login/`, `app/signup/` - new
- `components/skeleton.tsx`, `components/cart-skeleton.tsx`,
  `components/checkout-skeleton.tsx`, `components/cart-drawer.tsx` - new
- `components/site-header.tsx`, `components/add-to-cart-button.tsx`,
  `components/cart-view.tsx`, `components/checkout-form.tsx` - edited
- Reused unchanged: `app/cart/actions.ts` `getCartProducts`, `lib/cart.ts`
  `useCart`, `lib/format.ts`, existing button/card Tailwind patterns

## Data / contracts

- No schema, API, or persisted-data changes; the drawer reads the same
  zustand cart and the existing `getCartProducts` action.
- Drawer is a transient client-side view: it does not create, mutate, or
  delete cart data (all mutations still happen via the existing store
  actions on `/cart` and product pages).
- Dialog contract: `role="dialog"`, `aria-modal`, accessible name from the
  "Added to cart" heading, `Esc`/backdrop/X all close, initial focus
  inside the panel.
- Skeleton/error/404 content is static and contains no user data.

## Testing

No test command is configured, so there is no unit-test gate per
`coding-standards.md`. Step evidence is `pnpm exec tsc --noEmit`,
`pnpm lint`, and `pnpm build` staying green. `/check` does the live pass:
throttle/refresh to see the loading skeleton, hit a bad slug for the
branded 404, force an error boundary render if feasible, resize to ~360px
for the two-row header and no-overflow sweep, and exercise the drawer
(add, view items, checkout link, Esc/backdrop close).

## Notes for the AI

- `app/error.tsx` must be a client component and receives `{ error,
  reset }`; `app/not-found.tsx` and `app/loading.tsx` are server
  components. This is Next.js 16 App Router - `node_modules/next/dist/
  docs/` has guides if needed.
- The mounted-flag + `setTimeout(0)` hydration pattern in `cart-view.tsx`
  and `cart-link.tsx` exists because the cart persists to localStorage;
  mirror it in the drawer so SSR and hydrated markup agree.
- Amazon's add-to-cart flow navigates to a confirmation page; staying put
  with the drawer is the declared differentiator - keep the interaction
  instant (no spinners blocking the close action).
- Keep the zinc/`#131921`/`#ffd814`/`#febd69` palette and existing button
  styles consistent with the rest of the app.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":9903,"specSha256":"415789369c25b1bd25cc505d35255f6cff92becfec43b8bef5f45ce2a8dd2f7d","branch":"refs/heads/feature/polish-pass","head":"129afcc59ed89345d3f2a3ca08f0d38090a8bc32","baseRef":"refs/heads/main","baseCommit":"129afcc59ed89345d3f2a3ca08f0d38090a8bc32","sourceTree":"415c1a6175174a7d46c0462424272cbe947864d5","absentOptional":[]} -->
