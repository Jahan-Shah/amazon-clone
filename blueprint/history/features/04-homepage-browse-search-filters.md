# Feature: Homepage + browse/search + filters

**From build-plan:** feature 4
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/homepage-browse-search-filters`

## Goal

Replace the scaffold homepage with the real storefront: a site header with
search, a homepage of featured + per-category product sections, and a
`/search` page with keyword search, category filter, and price/rating sort.
All guest-accessible - no auth anywhere on these pages.

## In scope

- `lib/format.ts` - `formatPrice(cents)` -> USD string (integer cents contract)
- `lib/products.ts` - catalog query helpers + `CATEGORIES` constant
- `next.config.ts` - `images.remotePatterns` for `picsum.photos` (seeded image
  host)
- `components/site-header.tsx` - logo link + GET search form -> `/search`
- `components/product-card.tsx` - image, title, stars, price, slug link
- `app/layout.tsx` - render the header, update metadata to the app name
- `app/page.tsx` - featured grid + one section per category
- `app/search/page.tsx` - `q`/`category`/`sort` params, result grid, filter
  chips, sort control, designed empty state

## Out of scope

- `/product/[slug]` page itself (feature 5) - cards link to the canonical
  URL, which 404s until then
- Cart, header cart/account controls (features 6-7)
- Pagination (80 products render in one grid), debounced/live search,
  autocomplete
- Global `loading.tsx`/skeletons and error boundaries (feature 10 polish);
  the designed no-results state below is in scope
- Login prompts or any auth state in the header

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Foundation: `lib/format.ts` (`formatPrice` via
  `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` on
  `cents / 100`), `lib/products.ts` (`CATEGORIES` =
  `["Electronics","Home","Books","Fashion","Toys"]`, `getFeaturedProducts()`,
  `getProductsByCategory()`, `searchProducts()`, and a pure
  `normalizeSearchParams()` sanitizer), and `next.config.ts`
  `images.remotePatterns` for `https://picsum.photos/**`.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean; a `tsx` probe
  shows `searchProducts` returns seeded rows for a known term + category and
  that `price-asc` ordering is non-decreasing.

- [x] 2. Shell + card: `components/site-header.tsx` (brand link `/`, search
  `<form action="/search" method="get">` with a named `q` input and
  accessible label) and `components/product-card.tsx` (`next/image` first
  image, title link to `/product/[slug]`, star display, formatted price).
  Wire the header into `app/layout.tsx`; set metadata title/description for
  the app.
  **Done when:** `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`
  clean; no `no-img-element` lint warnings.

- [x] 3. Homepage `app/page.tsx`: featured grid (top 8 by `rating` desc,
  `reviewCount` desc tiebreak) followed by one section per `CATEGORIES`
  entry showing up to 4 products and a "See all" link to
  `/search?category=<name>`; replace the scaffold markup entirely.
  **Done when:** `pnpm build` compiles `/`; `pnpm lint`/`tsc` clean.

- [x] 4. Search page `app/search/page.tsx` (async server component,
  `await searchParams`): normalized `q`/`category`/`sort` drive
  `searchProducts`; render result count, product grid, category filter chips
  (links preserving `q`/`sort`), sort links or select preserving other
  params, and a designed empty state ("No results for ..." + clear-filters
  link) when nothing matches.
  **Done when:** `pnpm build` compiles `/search`; a `tsx` probe shows
  `normalizeSearchParams` maps invalid `sort`/`category` values and
  overlong/empty `q` to safe defaults; lint/tsc clean.

- [x] 5. Final gate: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
  **Done when:** all three pass.

## Files / areas

- `lib/format.ts`, `lib/products.ts` - new
- `components/site-header.tsx`, `components/product-card.tsx` - new
- `app/page.tsx`, `app/layout.tsx`, `app/search/page.tsx` - new/rewritten
- `next.config.ts` - remotePatterns

## Data / contracts

- URL contract (later features link here): `/search?q=<term>`,
  `category=<one of CATEGORIES>`, `sort=<featured|price-asc|price-desc|rating>`.
  Unknown `sort`/`category` fall back to defaults; `q` is trimmed, empty ->
  browse-all, cap at 200 chars.
- Search semantics: `q` matches `title` OR `description`, case-insensitive
  `contains`; `category` exact-matches; `featured` sort = `rating` desc then
  `reviewCount` desc.
- Product card links to `/product/[slug]` (canonical URL; page arrives in
  feature 5).
- Money renders via `formatPrice` only - display layer, cents stay integers.
- All queries are read-only and public; untrusted input is only the query
  string, sanitized by `normalizeSearchParams` before Prisma.
- Empty state is designed text + clear-filters link, never a blank page.

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is per-step commands plus `tsx` probes on
`searchProducts`/`normalizeSearchParams`. If a runner is added later,
`normalizeSearchParams` and `formatPrice` are the in-scope pure logic.

## Notes for the AI

- Next.js 16.3.5: `searchParams` is a `Promise` - `await` it in server
  components. Check `node_modules/next/dist/docs/` before assuming APIs.
- Tailwind v4 CSS-first; no `tailwind.config.js`. Style with utility classes;
  keep grids responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` shape).
- Star display: unicode stars (`Math.round(rating)` of 5) + `reviewCount` -
  no icon library is installed.
- Header keeps only brand + search; no cart/account links (features 6-7).
- No em dashes in generated files (coding-standards).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":5925,"specSha256":"4411350fc39248a6d201b5cde19083c13677281f6d431689b5a05e37964c1f7b","branch":"refs/heads/feature/homepage-browse-search-filters","head":"9e7bc228f84b3e0bfcc85fa421e870cea8aea005","baseRef":"refs/heads/main","baseCommit":"9e7bc228f84b3e0bfcc85fa421e870cea8aea005","sourceTree":"2c1f734934076fce134234cf13f51d0173b621eb","absentOptional":[]} -->
