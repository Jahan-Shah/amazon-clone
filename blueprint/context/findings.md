# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] open - Generated Prisma client is not reproducible on a fresh install

**File:** package.json (scripts), .gitignore:45, lib/db.ts:1
**Found:** 2026-09-21 by /audit independent (scope: current; lens: quality)
**Why it matters:** `lib/db.ts` and `prisma/seed.ts` import `@/generated/prisma/client`, which is gitignored and only exists after `prisma generate` runs (here, implicitly via `migrate dev`). Nothing in `package.json` regenerates it on install or build, and pnpm ignores prisma's own dependency postinstall (`pnpm-workspace.yaml` `ignoredBuiltDependencies` lists only `sharp` and `unrs-resolver`). A fresh `pnpm install && pnpm build` - including the named Vercel deploy target - fails at the unresolved generated import; the spec's step-5 `pnpm build` was verified only in the environment where generation already ran.
**Suggested fix:** add `"postinstall": "prisma generate"` to `package.json` (a project lifecycle script runs under pnpm) or a `prebuild` step so the client is generated wherever install/build runs.
**Resolution:**

### F-02 [P3] open - Review.productId foreign key has no database index

**File:** prisma/schema.prisma:26-27, prisma/migrations/20260921124659_init/migration.sql
**Found:** 2026-09-21 by /audit independent (scope: current; lens: performance)
**Why it matters:** Postgres does not index foreign-key columns, so the documented read path (a product's reviews on the detail page, feature 5) seq-scans `Review`. Trivial at 244 seeded rows, but the index is cheap and the access pattern is known now.
**Suggested fix:** add `@@index([productId])` to `Review` and regenerate the migration.
**Resolution:**

### F-03 [P3] open - Unset DATABASE_URL falls back to pg defaults instead of failing fast

**File:** lib/db.ts:9, prisma/seed.ts:184
**Found:** 2026-09-21 by /audit independent (scope: current; lens: quality)
**Why it matters:** `new PrismaPg({ connectionString: process.env.DATABASE_URL })` passes `undefined` through to the `pg` pool, which then falls back to PG* env vars / localhost defaults - connection errors point at the wrong host rather than naming the missing variable.
**Suggested fix:** read the env var once and throw a clear error when unset, or leave as-is if the project accepts pg's fallback semantics.
**Resolution:**
