# Feature: Better Auth setup

**From build-plan:** feature 2
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/better-auth-setup`

## Goal

Stand up session-based authentication plumbing with Better Auth: the server
auth instance on the Prisma adapter, the generated `user`/`session`/`account`/
`verification` schema migrated into Postgres, the `/api/auth/*` route handler,
and a client helper. Features 3 (orders keyed to `User.id`), 7 (signup/login
pages), and 8 (checkout) all consume this; this feature ships no user-facing
UI.

## In scope

- `better-auth` dependency (latest stable release)
- `lib/auth.ts` - server `auth` instance: Prisma adapter on the existing
  `lib/db.ts` client, `emailAndPassword: { enabled: true }`
- Better Auth CLI schema generation into `prisma/schema.prisma`, Prisma client
  regeneration, and a `better-auth` migration applied to Neon
- `app/api/auth/[...all]/route.ts` - catch-all handler for the Better Auth API
- `lib/auth-client.ts` - `createAuthClient` export for future client components
- `.env.example` entries for `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- Local `.env` populated with a real generated secret and the dev base URL

## Out of scope

- Signup/login pages, protected routes, header account dropdown (feature 7)
- `Address`, `Order`, `OrderItem` models (feature 3)
- Social/OAuth providers, email verification, password reset, magic links
- Rate-limit tuning, custom session expiry, admin/role fields
- Any UI or catalog changes

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Install Better Auth and set env: `pnpm add better-auth` (latest
  stable; keep the resolved version pinned by the lockfile). Add
  `BETTER_AUTH_SECRET=` and `BETTER_AUTH_URL=` placeholders to
  `.env.example`. In local `.env`, set `BETTER_AUTH_URL=http://localhost:3000`
  and a real `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`).
  **Done when:** `better-auth` resolves in `package.json`/lockfile;
  `.env.example` documents both vars with placeholder values only; `.env`
  stays untracked; `pnpm exec tsc --noEmit` clean.

- [x] 2. Create `lib/auth.ts`: export `auth = betterAuth({ database:
  prismaAdapter(db, { provider: "postgresql" }), emailAndPassword: { enabled:
  true } })`, importing `db` from `@/lib/db` (the existing PrismaPg-adapter
  client). Do not create a second Prisma client.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean; the file
  exports `auth`.

- [x] 3. Generate and migrate the auth schema: run the Better Auth CLI
  generate command for the installed version (`@better-auth/cli generate`;
  it reads `lib/auth.ts` and appends the `user`, `session`, `account`, and
  `verification` models to `prisma/schema.prisma`). Then `pnpm exec prisma
  generate` and `pnpm exec prisma migrate dev --name better-auth` (the CLI
  datasource uses `DATABASE_URL_UNPOOLED` via `prisma7.config.ts`).
  **Done when:** `pnpm exec prisma validate` passes; `pnpm exec prisma
  migrate status` shows the `better-auth` migration applied; the four
  generated models exist in `schema.prisma`; `pnpm exec tsc --noEmit` clean.
  If the CLI cannot parse `lib/auth.ts` or the schema (Prisma 7 layout), fix
  the minimal blocker and record what it was in the review packet - do not
  hand-write the models as a workaround.

- [x] 4. Add `app/api/auth/[...all]/route.ts`: `export const { GET, POST } =
  toNextJsHandler(auth.handler)` from `better-auth/next-js`. Confirm handler
  export shape against `node_modules/next/dist/docs/01-app/01-getting-started/
  15-route-handlers.md` if Next 16 differs.
  **Done when:** `pnpm build` succeeds and the route compiles.

- [x] 5. Add `lib/auth-client.ts`: `export const authClient =
  createAuthClient()` from `better-auth/react` (default base URL = same
  origin). Mark `"use client"`-compatible per Better Auth docs; feature 7
  imports this.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean.

- [x] 6. Live smoke against the dev server: `pnpm dev`, then verify
  - `GET http://localhost:3000/api/auth/ok` returns 200
  - `POST /api/auth/sign-up/email` with a test email/password returns 200
    with a session cookie, and a `user` row exists (query via the Prisma
    client)
  - `POST /api/auth/sign-in/email` with the same credentials returns 200;
    with a wrong password it returns an error (not 200)
  Then delete the test user row and shut the server down.
  **Done when:** all four responses observed as described and the test row
  is removed; final `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`
  all pass.

## Files / areas

- `package.json` / `pnpm-lock.yaml` - new `better-auth` dep
- `lib/auth.ts` - new; server auth instance
- `lib/auth-client.ts` - new; client-side auth client
- `app/api/auth/[...all]/route.ts` - new; auth API surface
- `prisma/schema.prisma` - CLI-generated `user`/`session`/`account`/
  `verification` models appended
- `prisma/migrations/` - new `better-auth` migration
- `.env.example` - document the two new vars
- `.env` - local secrets only; never committed

## Data / contracts

- Auth tables are generated by the Better Auth CLI, not hand-written (locked
  overview contract): `user` (`id` String PK, `email` unique, `name`,
  `emailVerified`, `image`?, timestamps), `session` (`token`, `expiresAt`,
  `userId` FK -> `user` cascade, ip/userAgent fields as generated),
  `account` (`providerId` = `"credential"` for email/password, `password`
  holds the hash), `verification`.
- `user.id` is the join key feature 3's `Address.userId`/`Order.userId`
  reference; treat the generated type (String) as the contract.
- Passwords are hashed by Better Auth (scrypt) into `account.password`;
  plaintext is never stored or logged. The password column must never be
  selected into API responses.
- Session = server-side row + httpOnly cookie; the trusted actor for later
  features is the session resolved by `auth.api.getSession`, never a
  client-supplied user id.
- `BETTER_AUTH_SECRET` is 32+ random bytes, env-only, never committed;
  `BETTER_AUTH_URL` is the app base URL (`http://localhost:3000` in dev,
  the Vercel URL in deployment).
- Email verification is not required in v1 (Better Auth default); no email
  sending exists yet.
- Auth API lives under the default base path `/api/auth` served by the
  catch-all route.

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is the per-step commands plus the step-6 live smoke
evidence. If a runner is added later, there is no in-scope pure logic here
beyond Better Auth's own surface.

## Notes for the AI

- Prisma 7.10.0, not the Prisma from training: generator is `prisma-client`
  emitting to `generated/prisma` (gitignored), and the runtime client uses
  the `PrismaPg` driver adapter. `prismaAdapter` accepts that client
  instance directly - no extra adapter package needed.
- CLI datasource URL comes from `prisma7.config.ts`
  (`DATABASE_URL_UNPOOLED`); migrate must not run against the pooled host.
- This is Next.js 16.3.5: check `node_modules/next/dist/docs/` before
  assuming route-handler or request APIs; the current docs still use named
  `GET`/`POST` exports in `route.ts`.
- The Better Auth CLI may ship as a separate `@better-auth/cli` package;
  use whatever the installed version documents for `generate`.
- Open findings from feature 1's audit (F-01 postinstall codegen, F-02
  Review index, F-03 DATABASE_URL fail-fast) exist; repairing them is not
  part of this spec - `/implement` may offer them separately.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":7806,"specSha256":"730779f93ba3ea917f2cc287e7ba44319652e766509a5695cffbb871cc26b0a1","branch":"refs/heads/feature/better-auth-setup","head":"b41e09f0a11db6323ff2cb7e3549fa4afbe35411","baseRef":"refs/heads/main","baseCommit":"a963131ea8a7a3b509999dbe159ea2f6bcd2e35b","sourceTree":"6a4e394fdd99886b028a892cd9d82b9eefae94cd","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** b41e09f0a11db6323ff2cb7e3549fa4afbe35411
**Base commit:** a963131ea8a7a3b509999dbe159ea2f6bcd2e35b
**Base ref:** main
**Spec hash:** 730779f93ba3ea917f2cc287e7ba44319652e766509a5695cffbb871cc26b0a1
**Prepared by:** codex
**Builder model:** SWE-2 High
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-21T13:40:00Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** unknown (runtime did not expose exact model)
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-21T13:43:49Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`: pass (equals Target commit b41e09f0a11db6323ff2cb7e3549fa4afbe35411)
- `git merge-base main HEAD`: pass (equals Base commit a963131ea8a7a3b509999dbe159ea2f6bcd2e35b)
- `sha256sum blueprint/context/current-feature.md`: pass (equals Spec hash)
- `git status --porcelain`: pass (only `M blueprint/context/review.md` differs from target; plus one untracked `.agent-logs/` transcript, see Remaining risk)
- `pnpm exec tsc --noEmit`: pass (exit 0, no output)
- `pnpm lint`: pass (exit 0, no findings)
- `pnpm build`: pass (Next.js 16.3.5 Turbopack; `/api/auth/[...all]` compiled as dynamic route)
- `pnpm exec prisma validate`: pass ("The schema at prisma/schema.prisma is valid")
- `pnpm exec prisma migrate status`: pass (2 migrations found, database schema up to date - `better_auth` migration applied to Neon)
- `git check-ignore .env` + `git ls-files/ls-tree HEAD -- .env`: pass (`.env` ignored via `.env*` pattern, untracked, absent from target tree)
- test command: unavailable (no `test` script in package.json; AGENTS.md Commands declares none)

## Evidence

- `lib/auth.ts:1-11` - `betterAuth` with `prismaAdapter(db, { provider: "postgresql" })` on the existing `lib/db.ts` client (no second Prisma client), `emailAndPassword: { enabled: true }`, `nextCookies()` plugin per Better Auth Next.js docs
- `lib/auth-client.ts:1-3` - `createAuthClient()` from `better-auth/react`, default same-origin base URL
- `app/api/auth/[...all]/route.ts:1-5` - `toNextJsHandler(auth.handler)` exporting `GET`/`POST`; build output lists `ƒ /api/auth/[...all]`
- `prisma/schema.prisma` - CLI-generated `User`/`Session`/`Account`/`Verification` models with `@@map` to `user`/`session`/`account`/`verification`; matches spec contract (String `id`, unique `email`, cascade `userId` FKs)
- `prisma/migrations/20260921132855_better_auth/migration.sql` - 4 tables, FK cascades to `user.id`, unique indexes on `user.email` and `session.token`, indexes on `session.userId`, `account.userId`, `verification.identifier`; consistent with schema and matches Better Auth 1.7.5's own table definitions (`@better-auth/core` get-tables.mjs)
- `.env.example:6-8` - `BETTER_AUTH_SECRET=` / `BETTER_AUTH_URL=` placeholders only; no secret values
- `package.json:17` + `pnpm-lock.yaml` - `better-auth` `^1.7.5` resolved to 1.7.5, lockfile internally consistent
- Working tree matches target except the two permitted evidence paths; no secrets committed anywhere in the delta

## Findings

- None (no new findings raised; existing F-01 [P2], F-02 [P3], F-03 [P3] remain `open` from the feature-1 audit and are non-blocking context, not re-reviewed as a checklist)

## Remaining risk

- No test runner is configured (AGENTS.md Commands), so the tests lens ran without an executable gate; the delta is thin integration glue around Better Auth's own tested surface with no in-scope pure logic
- Spec step-6 live smoke (`/api/auth/ok`, sign-up, sign-in against `pnpm dev`) was not independently re-run in this review; the Check gate is manual and was not required
- Untracked `.agent-logs/2026-09-21_13-10-22_foul-galliform.md` (49-line devin-cli session transcript, not gitignored) differs from the target tree; it is a CLI runtime artifact, not product code, and contains only prompt/response log entries - same treatment as the feature-1 review
- Local `.env` holds the real `BETTER_AUTH_SECRET` (correctly untracked); production deploy still needs both env vars provisioned on Vercel
- Reviewer runtime did not expose an exact model identifier for this subagent; recorded as `unknown (runtime did not expose exact model)` per contract
