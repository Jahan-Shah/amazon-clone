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

### F-06 [P2] open - toSafeCallbackPath returns raw control and non-latin1 characters, which 500s the redirect response

**File:** lib/session.ts:13-21 (reachable via app/login/page.tsx:11, app/signup/page.tsx:11)
**Found:** 2026-09-22 by /audit independent (scope: current; lens: security)
**Why it matters:** the origin check parses `path` through `new URL`, which percent-encodes control characters other than the stripped tab/LF/CR, so a value like `/`+VT+`x` resolves same-origin and the *original* string is returned. That string is then handed to `redirect()` in both auth pages, which places it in the `Location` response header; Node's header validation rejects raw control characters, so a crafted `callbackURL` likely yields a 500 on the attacker's own request (reachable only for a signed-in user). Impact is a self-inflicted error response, not header injection or open redirect, but it is an unhandled edge on a security boundary. Unverified: confirming requires a running server, which this review did not start; Next may also normalize the URL first and make it harmless.
**Suggested fix:** return the normalized `parsed.pathname + parsed.search + parsed.hash` instead of the original string (also fixes this class of edge permanently), or strip `/[\x00-\x1f\x7f]/` before returning.
**Resolution:** re-reviewed 2026-09-22 by /audit independent (fresh reviewer, commit 6a8ddb6): confirmed live against the dev server. Signed-in `GET /login?callbackURL=/%0Bx`, `/%01x`, `/%7Fx`, and `/%F0%9F%98%80` (emoji, outside latin1) all return HTTP 500 - Next places the raw returned string in the `Location` header and Node's header validation rejects it. `/\t`, `/\n`, `/\r` variants stay rejected to `/` (WHATWG strips them before the origin check). Reachable only by a signed-in user on their own request, so the impact is a self-inflicted error page, but it is a confirmed reachable defect on a public auth route - raised from unverified P3 to open P2. The normalized-return fix covers the non-latin1 case too since `new URL` percent-encodes pathname.

### F-07 [P3] open - Account dropdown Escape drops focus to document body

**File:** components/account-menu.tsx:23-34,72-83
**Found:** 2026-09-22 by /audit independent (scope: current; lens: quality)
**Why it matters:** the Escape handler calls `setOpen(false)`, which unmounts the dropdown div. If keyboard focus is inside the dropdown when Escape fires (Tab into "Your Orders" or "Sign out", then Escape), the focused element is removed and focus falls back to `document.body`, forcing keyboard users to re-Tab from the top of the page. Minor a11y rough edge on a hand-built disclosure; the widget still works.
**Suggested fix:** on Escape, also return focus to the trigger button (add a ref to the button and call `.focus()` before/after closing).
**Resolution:**

### F-09 [P3] open - Sign-out failure is silent and leaves an unhandled rejection

**File:** components/account-menu.tsx:49-54
**Found:** 2026-09-22 by /audit independent (scope: current; lens: quality)
**Why it matters:** `signOut` awaits `authClient.signOut()` with no try/catch. If the request fails (offline, expired backend, server error), the promise rejects unhandled and `setOpen(false)`, `router.push("/")`, and `router.refresh()` never run - the menu stays open, the user stays signed in, and nothing tells them the click failed. Both forms in this same feature surface failures inline via `role="alert"`, so this is an inconsistent dead-click path on a user action.
**Suggested fix:** wrap the call in try/catch; on failure still close the menu or show a brief inline error, matching the forms' error pattern.
**Resolution:**
