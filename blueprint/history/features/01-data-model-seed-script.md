# Feature: Data model + seed script

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** `feature/data-model-seed-script`
**Status:** verified

## Goal

Stand up the persisted catalog: Prisma + Postgres schema for `Product` and
`Review` (the two models this feature owns), a Prisma client access point, and
a deterministic seed script that loads ~80 products across 5 categories with
2-4 reviews each, per `project-overview.md`.

## In scope

- Prisma schema: `Product`, `Review` only (auth and order models are features
  2 and 3)
- `lib/db.ts` Prisma client singleton (the app's data-access point, reused by
  every later feature)
- `prisma/seed.ts`: deterministic catalog seed
- `package.json`: deps (`@prisma/client`, dev `prisma`, `tsx`) and seed wiring
- `.env.example` documenting `DATABASE_URL` (no secrets committed)
- First migration applied and seed run against the real database

## Out of scope

- `User`, `Session`, `Account`, `Verification` (Better Auth owns them -
  feature 2)
- `Address`, `Order`, `OrderItem` (feature 3)
- Any UI, routes, search, or cart usage of this data (features 4-6)
- Review submission; reviews are seeded and read-only
- `docker-compose`/local Postgres provisioning - the plan names Neon

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Install deps and scaffold Prisma: `pnpm add @prisma/client`,
  `pnpm add -D prisma tsx`; create `prisma/schema.prisma` (generator
  `prisma-client-js`, datasource `postgresql`, `url = env("DATABASE_URL")`),
  `.env.example` with `DATABASE_URL=` placeholder.
  **Done when:** `pnpm exec prisma validate` passes on the schema with both
  models present; `pnpm lint` and `pnpm exec tsc --noEmit` clean.

- [x] 2. Add `lib/db.ts` exporting a dev-safe Prisma client singleton (the
  standard `globalThis` cache pattern so dev hot-reload doesn't leak
  connections).
  **Done when:** `pnpm exec tsc --noEmit` clean; file imports `@/lib/db`
  alias-compatible path.

- [x] 3. Write `prisma/seed.ts`: deterministic catalog of ~80 products across
  Electronics, Home, Books, Fashion, Toys (16 per category), realistic titles
  and descriptions, `priceCents` integers, `stock >= 0`, `images` =
  `https://picsum.photos/seed/<slug>/640/480` (plus a second `?` variant image
  for the gallery), slug derived from title and unique. Each product gets 2-4
  reviews; `rating` and `reviewCount` are computed from that product's seeded
  reviews, not invented. Seed is re-runnable: `deleteMany` reviews then
  products, then create all rows.
  Wire `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }` and a
  `"db:seed": "prisma db seed"` script.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean on the seed
  file (it cannot run until step 4's env exists).

- [x] 4. Apply and seed against the real database. Requires `DATABASE_URL` in
  `.env` (Neon; use the direct endpoint, not the `-pooler` host, so
  `prisma migrate` works). Run `pnpm exec prisma migrate dev --name init`,
  then `pnpm db:seed`.
  **Done when:** `pnpm exec prisma migrate status` reports the `init`
  migration applied; a count query
  (`pnpm exec tsx -e "import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); Promise.all([p.product.count(),p.review.count()]).then(console.log).finally(()=>p.\$disconnect())"`)
  prints `80` products and a review count between 160 and 320; two products in
  different categories sampled by slug return seeded rows.

- [x] 5. Confirm nothing regressed: `pnpm build` succeeds and `pnpm lint` is
  clean on the whole repo.
  **Done when:** both commands pass.

## Files / areas

- `prisma/schema.prisma` - new; Product + Review only
- `prisma/seed.ts` - new; deterministic catalog + review generation
- `lib/db.ts` - new; Prisma client singleton
- `package.json` - deps + `prisma.seed` config + `db:seed` script
- `.env.example` - new; documents `DATABASE_URL`
- `.env` - user-provided locally; never committed (already gitignored)

## Data / contracts

- `Product`: `id` String cuid, `title` String, `slug` String `@unique`,
  `description` String, `priceCents` Int, `images` String[] (Postgres array),
  `category` String (one of Electronics, Home, Books, Fashion, Toys - string,
  not enum, so adding a category later needs no migration), `rating` Float,
  `reviewCount` Int, `stock` Int.
- `Review`: `id` String cuid, `productId` -> `Product` (`onDelete: Cascade`),
  `authorName` String, `rating` Int (1-5), `body` String.
- Money is integer cents; formatting is display-only (locked contract).
- `rating`/`reviewCount` on Product are denormalized display fields derived
  from its seeded reviews; no runtime writes exist in v1, so drift is
  impossible by construction.
- Seed behavior: full wipe of Product+Review then insert - re-running produces
  identical data (deterministic inputs, no randomness without a fixed seed).
- `DATABASE_URL` points at the Neon direct endpoint; if a pooled string is
  ever needed at runtime, revisit `directUrl` then - not now.

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is the per-step commands above plus the observable row
counts in step 4. If a test runner is added later, the slug builder and the
rating/reviewCount derivation are the in-scope pure logic worth covering.

## Notes for the AI

- The AGENTS.md `nextjs-agent-rules` block applies: this is Next.js 16.3.5,
  not the Next.js from training. Check `node_modules/next/dist/docs/` before
  assuming App Router APIs; this feature touches almost no Next.js surface,
  but `lib/db.ts` will be imported by server components later.
- pnpm is the package manager; never npm/yarn. `pnpm-workspace.yaml` already
  lists `ignoredBuiltDependencies` - if prisma's postinstall is blocked, add
  `prisma`/`@prisma/client` there rather than changing install config.
- Do not generate the Better Auth schema or any order models - later features
  own those.
- Seed titles/descriptions should look like a real catalog (brand-ish names,
  plausible specs), not lorem ipsum.

## Open questions

1. **`DATABASE_URL` / Neon project** - required before step 4. The plan names
   Neon Postgres; a project and connection string need to exist. Any Postgres
   URL unblocks the step, but deployment targets Neon.
2. **Product image source** - default recorded above: `picsum.photos` seeded
   URLs (deterministic, no assets to ship, easily reseeded). Say the word if
   you want bundled local images or a different source instead.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":6770,"specSha256":"4b79f706c74f0914c47014e126826989b7dd7f57eb69803a7de41d31538f4241","branch":"refs/heads/feature/data-model-seed-script","head":"1bd80897c0f58808c5a22cab84fcf347b090ab88","baseRef":"refs/heads/main","baseCommit":"f9a683b30d9349f166262d322cf1b591cade9f7e","sourceTree":"f06d47475e8fd1c8b1767aa0d3516040839d9c28","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 1bd80897c0f58808c5a22cab84fcf347b090ab88
**Base commit:** f9a683b30d9349f166262d322cf1b591cade9f7e
**Base ref:** main
**Spec hash:** 4b79f706c74f0914c47014e126826989b7dd7f57eb69803a7de41d31538f4241
**Prepared by:** codex
**Builder model:** SWE-2 High
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-21T12:55:52Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** unknown (runtime did not expose exact model)
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-21T13:03:46Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD` -> `1bd80897c0f58808c5a22cab84fcf347b090ab88` matches Target commit: pass
- `git merge-base main HEAD` -> `f9a683b30d9349f166262d322cf1b591cade9f7e` matches Base commit; base ref `main` is local `main`: pass
- `sha256sum blueprint/context/current-feature.md` -> `4b79f706...8f4241` matches Spec hash: pass
- `git status --porcelain` -> only `blueprint/context/review.md` and tracked session transcript `.agent-logs/2026-09-21_10-53-14_snowy-chopper.md` differ from target: pass with caveat (see Remaining risk)
- `git diff f9a683b30d9349f166262d322cf1b591cade9f7e..1bd80897c0f58808c5a22cab84fcf347b090ab88` -> full delta inspected (11 files, excl. lockfile/spec reviewed separately): pass
- `git ls-files` + `git check-ignore .env` -> only `.env.example` is tracked; `.env` untracked and ignored; `generated/prisma` ignored: pass
- `node -e` slug-uniqueness check over the CATALOG literals -> 80 products, 16 per category, 0 duplicate slugs: pass
- `pnpm exec tsc --noEmit` -> pass (clean)
- `pnpm lint` -> pass (clean)
- `pnpm exec prisma validate` -> pass; loaded `prisma7.config.ts` and schema
- `pnpm build` -> pass (Next.js 16.3.5 production build)
- grep of `node_modules/prisma/build/cli.js` -> `prisma7.config.ts` is the Prisma 7.10 default config filename (also written by `prisma init`): pass
- `pnpm-lock.yaml` importer inspection -> `prisma` pinned `7.10.0`, `@prisma/client`/`adapter-pg` resolved `7.10.0`: pass

## Evidence

- `prisma/schema.prisma` -> `Product` + `Review` only; contract honored: cuid ids, `slug @unique`, `priceCents Int`, `images String[]`, `category String`, `rating Float`, `reviewCount Int`, `stock Int`, `Review.productId -> Product onDelete: Cascade`. No auth or order models pulled forward.
- `prisma/migrations/20260921124659_init/migration.sql` -> matches schema: `Product_slug_key` unique index, FK `ON DELETE CASCADE`, INTEGER money columns.
- `prisma/seed.ts` -> mulberry32(42) seeded RNG (deterministic, no time/Math.random inputs); wipes reviews then products then inserts (idempotent per spec); 2-4 reviews per product; `rating`/`reviewCount` computed from each product's seeded reviews, not invented; `priceCents` integer 999-24999; `stock` 0-60; images are `picsum.photos/seed/<slug>/640/480` plus a `<slug>-alt` second image - a literal `?` suffix would return the identical picsum image, so the `-alt` seed satisfies the spec's gallery-variant intent.
- `lib/db.ts` -> standard `globalThis` dev-safe singleton; `PrismaPg` adapter on pooled `DATABASE_URL`.
- `prisma7.config.ts` -> CLI datasource `url` bound to `DATABASE_URL_UNPOOLED` (direct endpoint for migrate per spec); seed wired via `migrations.seed` and invoked by `prisma db seed` through the `db:seed` script (Prisma 7 location for the seed config the spec described in `package.json`).
- `.env.example` -> placeholder values only, no secrets; `!.env.example` un-ignored correctly; `.neon` ignored.
- `package.json` -> deps only as scoped (`@prisma/client`, `@prisma/adapter-pg`, `pg`; dev `prisma@7.10.0`, `tsx`, `dotenv`, `@types/pg`); `db:seed` script added.
- Tests lens: no test runner configured (spec and `coding-standards.md` confirm); no test files, skips, or placeholder tests exist in the delta.

## Findings

- F-01 [P2] open - Generated Prisma client is not reproducible on a fresh install (no `postinstall`/`prebuild` codegen step; `generated/prisma` is gitignored and pnpm ignores prisma's dependency postinstall)
- F-02 [P3] open - `Review.productId` foreign key has no database index
- F-03 [P3] open - Unset `DATABASE_URL` falls back to pg defaults instead of failing fast

See `blueprint/context/findings.md` for details. No P0 or P1 findings; P2/P3 findings do not block `passed`.

## Remaining risk

- Live database state was not verified by this review: `prisma migrate status`, `pnpm db:seed`, and the row-count query require the Neon connection (network-backed, outside the read-only audit scope). Builder-reported evidence in `.agent-logs`: `init` migration applied, 80 products / 244 reviews seeded.
- No test runner exists, so `slugify`, the seeded RNG, and the rating/reviewCount derivation have no automated coverage. The spec explicitly defers this; noted as the in-scope pure logic if a runner is added later.
- `.agent-logs/2026-09-21_10-53-14_snowy-chopper.md` is a tracked file that differs from the target commit; it is the CLI's own appended session transcript, not product code, flagged here for freshness completeness.
- `pnpm build` was run in the existing working tree, not a clean checkout; F-01 covers the fresh-install gap that this cannot observe.
