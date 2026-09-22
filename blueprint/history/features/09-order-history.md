# Feature: Order history

**From build-plan:** feature 9
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/order-history`

## Goal

Give a signed-in shopper a "Your Orders" page listing every past order
newest-first, plus a per-order detail page showing items, shipping address,
status, and total. Both routes already exist in intent: `proxy.ts` gates
`/orders/:path*` and the account dropdown links "Your Orders" to `/orders`;
this feature builds the two pages.

## In scope

- `app/orders/page.tsx` (server component): order list for the signed-in
  user, newest first.
- `app/orders/[id]/page.tsx` (server component): full detail for one order
  owned by the signed-in user.
- All orders are listed, including `status: "pending"` (unpaid or
  payment-confirming orders from feature 8). Each shows a status label.
- A designed empty state for users with no orders, with a
  continue-shopping link.
- A `formatDate` helper in `lib/format.ts` for the order-placed date.
- A small shared status-label/badge element used by both pages.

## Out of scope

- Pagination or search within orders (demo scale; list renders all).
- Reorder/"buy again", cancel, returns, refunds, tracking, invoices.
- Changing `Order.status` or adding new statuses; `shipped` stays
  unreachable in v1.
- Loading skeletons/route `loading.tsx` - feature 10 polish pass.
- Any client-side state or mutations; these pages are read-only server
  components.

## Build loop

`workflow.stepReview: "feature"` and `workflow.checkpointCommits:
"disabled"`: implement all steps in order, then present one review packet.
No per-step checkpoint commits; `/complete` creates the final feature commit.

## Build steps

- [x] 1. Order list page at `/orders`.
  In `lib/format.ts` add `formatDate(date: Date)` using
  `Intl.DateTimeFormat("en-US", { month: "short", day: "numeric",
  year: "numeric" })`. Add a small `components/order-status.tsx` (or inline
  helper if it stays trivial) mapping `pending | paid | shipped` to display
  labels ("Payment pending", "Paid", "Shipped") with a styled badge; an
  unrecognized status renders its raw value rather than crashing.
  `app/orders/page.tsx`: `getSession()`; absent -> `redirect("/login?
  callbackURL=/orders")` (defense in depth behind `proxy.ts`). Query
  `db.order.findMany({ where: { userId: session.user.id }, orderBy:
  { createdAt: "desc" }, include: { items: { include: { product: true } }
  } })`. Render each order as a card: placed date, total, `#<id>`, status
  badge, item thumbnails/titles/qty, and a "View order details" link to
  `/orders/<id>`. Zero orders renders the designed empty state (heading +
  copy + link to `/`). Reuse the success page's card and item-row markup
  style.
  Done when: a signed-in user with orders sees them newest-first with
  date, total, status, items, and a working detail link; a user with no
  orders sees the empty state; a guest hitting `/orders` lands on login
  with `callbackURL=/orders`; `pnpm exec tsc --noEmit` and `pnpm lint`
  pass.

- [x] 2. Order detail page at `/orders/[id]`.
  `app/orders/[id]/page.tsx`: `params` is a Promise (`{ id: string }`).
  `getSession()`; absent -> redirect to `/login?callbackURL=` +
  `encodeURIComponent("/orders/" + id)`. Query
  `db.order.findFirst({ where: { id, userId: session.user.id }, include:
  { items: { include: { product: true } }, address: true } })` - the same
  scoped pattern as `app/checkout/success/page.tsx`; `notFound()` on null
  (unknown or foreign id, no existence leak). Render: order `#<id>`,
  placed date via `formatDate`, status badge (shared component from step
  1), item list with image, title, qty, snapshot `priceCents` and line
  totals via `formatPrice`, the shipping address block, order total, and
  a back link to `/orders`. Address text renders through React escaping
  only.
  Done when: the owner sees the full detail matching what the checkout
  success page showed; a valid-but-foreign order id and a nonsense id both
  return 404; a guest is redirected to login with the callback preserving
  the order path; `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`
  pass with `/orders` and `/orders/[id]` in the route table.

## Files / areas

- `app/orders/page.tsx`, `app/orders/[id]/page.tsx` - new
- `components/order-status.tsx` - new (small badge/label shared by both
  pages)
- `lib/format.ts` - add `formatDate`
- Reused unchanged: `lib/session.ts` `getSession()`, `lib/db.ts`,
  `formatPrice`, `proxy.ts` matcher (`/orders/:path*` already present),
  `components/account-menu.tsx` ("Your Orders" link already present),
  item-row markup pattern from `app/checkout/success/page.tsx`

## Data / contracts

- Read-only feature: no schema changes, no writes, no new API routes or
  Server Actions.
- Tenant boundary: every order query is scoped by `session.user.id` from
  `getSession()` server-side; a client-supplied id never reaches the
  query. Foreign or unknown order ids -> `notFound()` (404), identical to
  the success page.
- `Order.status` is a free string in the schema; the UI maps
  `pending | paid | shipped` to labels and falls back to the raw value.
- Money stays integer cents; `formatPrice` for display. Item prices shown
  are the `OrderItem.priceCents` snapshots, never current product prices.
- `formatDate` renders in the server timezone; consistent for this demo.
- Product on an `OrderItem` is guaranteed present (`onDelete: Restrict`
  prevents deleting an ordered product); no null-product handling needed.
- Login redirect contract: `callbackURL` preserves the attempted path so
  the user returns after signing in (matches checkout's pattern).

## Testing

No test command is configured, so there is no unit-test gate per
`coding-standards.md`. Step evidence is `pnpm exec tsc --noEmit`,
`pnpm lint`, and `pnpm build` staying green. `/check` does the live pass:
sign in, view `/orders` empty state for a fresh account, place a Stripe
test order, confirm it appears in the list and the detail page matches
the confirmation, and confirm a foreign/unknown id 404s.

## Notes for the AI

- This is Next.js 16: `params`/`searchParams` are Promises; server
  components fetch directly (no client fetching per coding standards).
  `node_modules/next/dist/docs/` has the relevant guides if needed.
- `proxy.ts` already matches `/orders/:path*` (zero-or-more segments, so
  bare `/orders` is covered); `account-menu.tsx` already links to
  `/orders`. Do not rebuild either.
- Pending-order decision (deferred here by feature 8's spec): the list
  shows all orders with a status label rather than filtering to paid.
  Hiding `pending` would make a just-paid order vanish while the webhook
  lands and would hide orders the success page already showed the user.
- Keep markup consistent with `app/checkout/success/page.tsx` (zinc
  palette, rounded cards, `#ffd814` button style) and Tailwind v4
  CSS-first conventions.
- `User.name`, address lines, and product titles are rendered text only;
  React escaping covers them, no sanitization layer.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7037,"specSha256":"ae060eda34de8adf8e462cde953f853a83c8a6e84b446049005eee463fdd14c2","branch":"refs/heads/feature/order-history","head":"9615c076162ec5c1fd58870d28e961fb2368f152","baseRef":"refs/heads/main","baseCommit":"0430c869f359f5482ccb9b08b7e68c317755e8ba","sourceTree":"f0869ec7c01233748ca8987ebddbd4f9751eb274","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 9615c076162ec5c1fd58870d28e961fb2368f152
**Base commit:** 0430c869f359f5482ccb9b08b7e68c317755e8ba
**Base ref:** main
**Spec hash:** ae060eda34de8adf8e462cde953f853a83c8a6e84b446049005eee463fdd14c2
**Prepared by:** codex
**Builder model:** SWE-2 High
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-22T21:28:31Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** unknown (runtime did not expose exact model)
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-22T21:32:04Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD` -> 9615c076162ec5c1fd58870d28e961fb2368f152: pass (equals Target commit)
- `git merge-base main HEAD` -> 0430c869f359f5482ccb9b08b7e68c317755e8ba: pass (equals Base commit)
- `sha256sum blueprint/context/current-feature.md` -> ae060eda...14c2: pass (equals Spec hash)
- `git status --porcelain`: pass (only blueprint/context/review.md differs from target)
- `pnpm exec tsc --noEmit`: pass
- `pnpm lint`: pass (no output)
- `pnpm build`: pass (route table includes dynamic /orders and /orders/[id])

## Evidence

- Reviewed the complete `0430c869..9615c07` delta: app/orders/page.tsx, app/orders/[id]/page.tsx, components/order-status.tsx, lib/format.ts, blueprint/context/current-feature.md, .agent-logs/2026-09-22_21-17-00_mewing-journey.md.
- Tenant boundary verified: app/orders/page.tsx uses `db.order.findMany({ where: { userId: session.user.id } })`; app/orders/[id]/page.tsx uses `db.order.findFirst({ where: { id, userId: session.user.id } })`. Client-supplied `id` never reaches a query unscoped.
- `notFound()` on null covers foreign and unknown order ids identically (no existence leak); matches the app/checkout/success/page.tsx pattern.
- Guest access: proxy.ts matcher already covers `/orders/:path*`; page-level `getSession()` redirects to `/login?callbackURL=/orders` (list) and `/login?callbackURL=${encodeURIComponent("/orders/" + id)}` (detail), preserving the attempted path; login validates via `toSafeCallbackPath`.
- `OrderStatus` maps pending/paid/shipped and falls back to the raw value for unrecognized statuses; `formatDate` uses `Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })` per spec.
- Money stays integer cents with `formatPrice`; item prices render `OrderItem.priceCents` snapshots; address renders through React escaping only; `Order.address` is a required relation in prisma/schema.prisma.
- Order.userId has `@@index` in the schema, so the newest-first list query is indexed; Prisma `include` batches item/product loads (no N+1); unbounded list is explicitly out of scope in the spec.

## Findings

- F-14 [P3] open - order item-row markup duplicated across three pages (new this pass).
- Pre-existing ledger findings unchanged: F-01, F-06 [P2], F-02, F-03, F-07, F-09, F-10, F-11, F-12, F-13 [P3] all open; none are P0/P1 and none were introduced by this delta.

## Remaining risk

- No test command is configured in this project, so there is no unit-test gate; per coding-standards.md and the spec's Testing section, evidence is tsc/lint/build plus the /check live pass.
- Check was not required and not run: the live behavior (empty state, list ordering, detail 404 on foreign/unknown id, guest redirect round-trip) was verified by code review and build output only, not against a running app.
- `item.product.images[0]` assumes a non-empty images array; the same unchecked assumption already exists on the checkout success page and product pages, so this delta adds no new exposure.
