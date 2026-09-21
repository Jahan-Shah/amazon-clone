# Feature: Address + Order + OrderItem models

**From build-plan:** feature 3
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/address-order-orderitem-models`

## Goal

Extend the Prisma schema with the order-persistence models - `Address`,
`Order`, `OrderItem` - related to Better Auth's generated `User.id`, plus the
migration that creates them on Neon. Checkout (feature 8) and order history
(feature 9) write and read these tables; this feature ships schema only.

## In scope

- `Address`, `Order`, `OrderItem` models in `prisma/schema.prisma`
- `addresses Address[]` and `orders Order[]` back-relations on `User`
- `@@index` on every new foreign-key column
- `pnpm exec prisma generate` + a `order-models` migration applied to Neon
- A read-path smoke check proving the generated client exposes the new models

## Out of scope

- Any order writes, checkout flow, or address forms (feature 8)
- Order-history UI or queries (feature 9)
- Seeding orders/addresses - nothing creates them until checkout exists
- `User` field changes beyond the two relation lists
- Changing the `shipped` status value or adding admin tooling to reach it

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Extend `prisma/schema.prisma`: add the three models per the Data /
  contracts below, add `addresses`/`orders` relation lists to `User`, and an
  `@@index` on each new FK column. Run `pnpm exec prisma generate`.
  **Done when:** `pnpm exec prisma validate` passes; `pnpm exec tsc --noEmit`
  and `pnpm lint` clean.

- [x] 2. Migrate: `pnpm exec prisma migrate dev --name order-models` (CLI
  datasource resolves `DATABASE_URL_UNPOOLED` via `prisma7.config.ts`).
  **Done when:** `pnpm exec prisma migrate status` reports the migration
  applied; the generated `migration.sql` contains the three tables, FKs,
  unique constraints, and indexes matching the schema.

- [x] 3. Read-path smoke against the live database: a one-shot `tsx` check
  (`pnpm exec tsx -e ...` with `dotenv/config`) that calls `db.address.count()`,
  `db.order.count()`, and `db.orderItem.count()` through the existing
  `lib/db.ts` client. Then the final gate.
  **Done when:** all three counts return `0` without errors (proving the
  client, schema, and migrated tables agree); `pnpm lint`,
  `pnpm exec tsc --noEmit`, and `pnpm build` all pass.

## Files / areas

- `prisma/schema.prisma` - three new models, two `User` relation lists
- `prisma/migrations/` - new `order-models` migration
- `generated/prisma` - regenerated client (gitignored)

## Data / contracts

- `Address`: `id String @id @default(cuid())`, `userId` -> `User`,
  `line1 String`, `line2 String?`, `city String`, `state String`,
  `zip String`; `@@index([userId])`.
- `Order`: `id String @id @default(cuid())`, `userId` -> `User`,
  `addressId` -> `Address`, `status String` (values: `pending`, `paid`,
  `shipped`), `totalCents Int`, `createdAt DateTime @default(now())`,
  `items OrderItem[]`; `@@index([userId])`, `@@index([addressId])`.
- `OrderItem`: `id String @id @default(cuid())`, `orderId` -> `Order`,
  `productId` -> `Product`, `quantity Int`, `priceCents Int`;
  `@@index([orderId])`, `@@index([productId])`.
- Locked shapes (overview): `OrderItem.priceCents` is the purchase-time
  snapshot - order totals must not drift when product prices change - and all
  money stays integer cents.
- `status` is a `String`, matching the `category String` convention: no DB
  enum, values documented above. Nothing in v1 moves an order past `paid`;
  keep `shipped` in the contract anyway.
- Referential actions: `Address.userId`, `Order.userId`, and
  `OrderItem.orderId` use `onDelete: Cascade` (consistent with
  `Session`/`Account`/`Review`); `Order.addressId` and
  `OrderItem.productId` use `onDelete: Restrict` so deleting an address or
  product cannot silently erase order history - the snapshot contract's
  reason for existing.
- `User.id` is Better Auth's generated `String` id; these FKs reference it
  directly (the feature-2 contract).

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is the per-step commands plus the step-3 live count
queries. No in-scope pure logic exists to cover later.

## Notes for the AI

- Prisma 7.10.0 with the `prisma-client` generator emitting to
  `generated/prisma`; regenerate after schema edits.
- The `User` model is Better Auth-generated. If `generate` is ever re-run
  (plugin changes), it may drop the `addresses`/`orders` relation lists;
  re-add them if that happens.
- Do not touch `Product`, `Review`, `Session`, `Account`, or `Verification`.
- No em dashes in any generated file (coding-standards).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":4937,"specSha256":"bca4b9a32f07ce5be84a227a0228c1a4a2f8ad84bc531859bad9ca4c62404394","branch":"refs/heads/feature/address-order-orderitem-models","head":"2410c31216ae8e9d68977c5e22c40647327c6a0d","baseRef":"refs/heads/main","baseCommit":"9d730ec9b828e2dea6ccab308717696b50bfdcf8","sourceTree":"92ac61756b5da81bd15fcc651930e35bdaef6311","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 2410c31216ae8e9d68977c5e22c40647327c6a0d
**Base commit:** 9d730ec9b828e2dea6ccab308717696b50bfdcf8
**Base ref:** main
**Spec hash:** bca4b9a32f07ce5be84a227a0228c1a4a2f8ad84bc531859bad9ca4c62404394
**Prepared by:** codex
**Builder model:** SWE-2 High
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-21T16:35:00Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** unknown (runtime did not expose exact model)
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-21T16:32:00Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`: pass - equals Target commit `2410c31216ae8e9d68977c5e22c40647327c6a0d`
- `git merge-base main HEAD`: pass - equals Base commit `9d730ec9b828e2dea6ccab308717696b50bfdcf8` via base ref `main`
- `sha256sum blueprint/context/current-feature.md`: pass - equals Spec hash `bca4b9a3...2404394`
- `git status --porcelain`: pass - only `blueprint/context/review.md` modified; one untracked `.agent-logs/` CLI transcript (not product code; see Remaining risk)
- `git diff 9d730ec9b828e2dea6ccab308717696b50bfdcf8..2410c31216ae8e9d68977c5e22c40647327c6a0d` (full delta inspection): pass - 3 files: spec doc, `prisma/schema.prisma` (+45), `prisma/migrations/20260921162511_order_models/migration.sql` (+65)
- `pnpm exec prisma validate`: pass - schema valid
- `pnpm exec tsc --noEmit`: pass - clean
- `pnpm lint` (eslint): pass - clean
- `pnpm build` (next build, Next.js 16.3.5 Turbopack): pass - compiled, TypeScript finished, 4/4 static pages generated
- `pnpm exec prisma migrate status`: pass - first attempt returned P1001 (Neon cold start); retried after ~15s, passed: 3 migrations found, database schema up to date
- `pnpm exec tsx` read-path smoke (`db.address.count()`, `db.order.count()`, `db.orderItem.count()` via `lib/db.ts` with `dotenv/config`): pass - all three returned 0 against live Neon
- Secret scan of full delta (`grep -iE "password|secret|api_key|token|postgres://|sk-|bearer"`): pass - no secret values; only the env-var name `DATABASE_URL_UNPOOLED` in spec prose
- `git check-ignore -v .env generated/prisma`: pass - `.env*` ignored at .gitignore:34, `/generated/prisma` at .gitignore:45
- Test runner command: unavailable - no test script in package.json; AGENTS.md confirms none configured

## Evidence

- `prisma/schema.prisma:99-111` - `Address` model: `id String @id @default(cuid())`, `userId` FK `onDelete: Cascade` to `User`, `line1`/`line2?`/`city`/`state`/`zip`, `@@index([userId])` - matches spec contract
- `prisma/schema.prisma:113-126` - `Order` model: `userId` Cascade, `addressId` Restrict, `status String`, `totalCents Int`, `createdAt @default(now())`, `items OrderItem[]`, `@@index([userId])` + `@@index([addressId])` - matches spec
- `prisma/schema.prisma:128-139` - `OrderItem` model: `orderId` Cascade, `productId` Restrict, `quantity`/`priceCents Int`, `@@index([orderId])` + `@@index([productId])` - matches spec
- `prisma/schema.prisma:44-45` - `User` gains only `addresses Address[]` and `orders Order[]`; all Better Auth fields (`name`, `email`, `emailVerified`, `image`, timestamps, `sessions`, `accounts`, `@@unique([email])`, `@@map("user")`) unchanged - verified via git diff
- `prisma/schema.prisma:22` - `Product` gains only `orderItems OrderItem[]` (Prisma-required back-relation for `OrderItem.productId`); no other Product fields touched
- `prisma/migrations/20260921162511_order_models/migration.sql:2-35` - three CREATE TABLEs matching schema; `:38-50` five FK indexes; `:53-65` five FKs with correct `ON DELETE CASCADE`/`RESTRICT` actions referencing `"user"("id")`, `"Address"("id")`, `"Order"("id")`, `"Product"("id")` - identical to schema relations
- `pnpm exec prisma migrate status` - `order_models` migration applied; database schema up to date on live Neon
- Live read-path smoke returned `address: 0 order: 0 orderItem: 0` - generated client, schema, and migrated tables agree
- `grep` for em/en dashes in `prisma/schema.prisma` and `migration.sql`: none - coding-standards rule satisfied

## Findings

- None - no new findings raised this pass. Existing ledger entries F-01 (P2), F-02 (P3), F-03 (P3) remain `open` as context; none is P0/P1 and none was modified.

## Remaining risk

- Test lens: no test runner is configured in this project (no `test` script; AGENTS.md states none). No executable test signal exists; the delta is schema/migration only with no in-scope pure logic to cover. Verification rested on validate, typecheck, lint, build, migrate status, and the live count smoke.
- Untracked `.agent-logs/2026-09-21_13-10-22_foul-galliform.md` is the CLI runtime's own session transcript, not product code. It is not gitignored; if left untracked it could be swept into a later commit - worth an ignore rule or cleanup decision outside this review.
- `Order.userId` uses `onDelete: Cascade` per the explicit spec contract (consistent with `Session`/`Account`/`Review`), so deleting a user erases their order history. This is a spec-level decision, not a code defect; flagged only as residual data-lifecycle risk.
- `pnpm exec prisma migrate status` initially failed with P1001 while Neon was cold; it passed on retry. Transient cold-start behavior, not a defect.
- `pg` emitted an SSL-mode deprecation warning during the tsx smoke (pg-connection-string v3 / pg v9 will change `sslmode` semantics). Dependency notice unrelated to this delta; worth noting for a future dependency bump.
