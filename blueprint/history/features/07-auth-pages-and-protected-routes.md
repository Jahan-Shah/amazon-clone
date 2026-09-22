# Feature: Auth pages and protected routes

**From build-plan:** feature 7
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/auth-pages-and-protected-routes`

## Goal

Make Better Auth reachable from the UI: `/login` and `/signup` pages on the
existing `authClient`, an optimistic route guard (`proxy.ts`, the Next 16
middleware rename) covering `/checkout` and `/orders`, and a header account
menu that shows "Hello, sign in" to guests and the user's name with Orders /
Sign out to signed-in shoppers.

## In scope

- `lib/session.ts` - `getSession()` server helper wrapping
  `auth.api.getSession({ headers: await headers() })`, plus
  `toSafeCallbackPath(value)`: returns `value` only when it is a same-origin
  path (`/`-prefixed, not `//`-prefixed), else `"/"`
- `app/login/page.tsx` - server page: reads `searchParams.callbackURL`,
  sanitizes via `toSafeCallbackPath`, redirects already-signed-in users to
  that path, renders the client form
- `app/signup/page.tsx` - same shape; form fields: name, email, password
- `components/login-form.tsx`, `components/signup-form.tsx` - client forms
  calling `authClient.signIn.email` / `authClient.signUp.email` with
  `callbackURL`; inline error region (`role="alert"`), associated labels,
  submit disabled while pending
- `proxy.ts` (project root) - redirects requests lacking the session cookie
  on `/checkout` and `/orders/:path*` to
  `/login?callbackURL=<path + search>`
- `components/account-menu.tsx` - client component using
  `authClient.useSession()`, mounted/pending-gated to the guest rendering;
  signed-in state shows `Hello, {name}` with a dropdown: "Your Orders" ->
  `/orders`, "Sign out"
- `components/site-header.tsx` - render `AccountMenu` next to `CartLink`
- Dev-server live smoke covering signup, login, wrong-password error, guard
  redirect, header state, sign out

## Out of scope

- `/checkout` (feature 8) and `/orders` + `/orders/[id]` (feature 9)
  themselves - they still 404; the guard and menu links point at routes that
  do not exist yet, same dead-link contract as the cart's checkout link
- Page-level session enforcement inside those future pages is their own
  spec's job; this feature ships the `getSession` helper they will call and
  the proxy that gives the UX redirect now
- Merging the guest cart into an account cart (feature 6 spec: no such
  contract)
- Email verification, password reset, OAuth/social, magic links, account
  settings pages
- Signup-fields beyond name/email/password; no roles or profile editing

## Build loop

`workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`:
build all steps, run the checks in each `Done when`, then present one
feature-level review packet with the full diff. No per-step pauses or
checkpoint commits. `/complete` creates the feature commit.

## Build steps

- [x] 1. Auth helpers: create `lib/session.ts` exporting `getSession()` and
  `toSafeCallbackPath(value: string | undefined | null)`. Rules:
  `undefined`/`""`/absolute URLs/protocol-relative (`//host`) -> `"/"`;
  `"/checkout?x=1"` passes through unchanged.
  **Done when:** `pnpm exec tsc --noEmit` and `pnpm lint` clean; a `tsx`
  probe on `toSafeCallbackPath` covers `/checkout`, `//evil.com`,
  `https://evil.com`, `undefined`, and `""`.

- [x] 2. Auth pages + forms: `app/login/page.tsx`, `app/signup/page.tsx`,
  `components/login-form.tsx`, `components/signup-form.tsx`. Server pages
  await `searchParams`, sanitize `callbackURL`, call `getSession()` and
  `redirect(safePath)` when already signed in. Client forms wire
  `authClient.signIn.email({ email, password, callbackURL })` and
  `authClient.signUp.email({ name, email, password, callbackURL })`;
  surface `error.message` inline, keep submit disabled while the request is
  pending. Pages link to each other ("New here? Create an account" /
  "Already have an account? Sign in") preserving `callbackURL`.
  **Done when:** `pnpm build` compiles `/login` and `/signup`;
  `pnpm lint`/`tsc` clean.

- [x] 3. Route guard: root `proxy.ts` per
  `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` -
  named `proxy` export + `config.matcher = ["/checkout", "/orders/:path*"]`.
  Missing session cookie -> `NextResponse.redirect` to `/login` with
  `callbackURL` set to `request.nextUrl.pathname + request.nextUrl.search`.
  Cookie present -> `NextResponse.next()`.
  **Done when:** `pnpm build` compiles `proxy.ts`; `pnpm lint`/`tsc` clean.

- [x] 4. Header account menu: `components/account-menu.tsx` - while
  `useSession().isPending` or before mount, render the guest link (avoids
  hydration mismatch, same gate as `cart-link.tsx`); signed out -> "Hello,
  sign in" link to `/login`; signed in -> "Hello, {user.name}" button
  opening a dropdown with "Your Orders" (`/orders`) and "Sign out"
  (`authClient.signOut()` then `router.push("/")` + `router.refresh()`).
  Dropdown closes on outside click and Escape. Wire into `site-header.tsx`
  before `CartLink`.
  **Done when:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` clean.

- [x] 5. Live smoke against `pnpm dev` (fresh test email, then remove the
  user row via the Prisma client afterward):
  - `POST /api/auth/sign-up/email` succeeds and sets the session cookie;
    signed-in `GET /checkout` passes the proxy through to the 404
  - signed-out `GET /checkout` returns a redirect to
    `/login?callbackURL=%2Fcheckout`; `GET /orders` and `/orders/abc`
    likewise; `GET /login` with that cookie redirects away from the form
  - `POST /api/auth/sign-in/email` with a wrong password returns an error,
    correct credentials return 200
  - browser: header shows "Hello, sign in" signed out and "Hello, {name}"
    with the dropdown signed in; sign out returns to `/` and the guest
    header
  **Done when:** every response/state observed as described, the test user
  row deleted; final `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`
  all pass.

- [x] 6. Repair F-04 (independent review, P1): `toSafeCallbackPath` must
  reject values that WHATWG URL parsing resolves off-origin, not just
  `//`-prefixed strings - `/\evil.com` and `/` + tab + `/evil.com` both
  parse to `https://evil.com/`. Validate via `new URL(path, base)` and
  require the placeholder origin; keep returning the original string.
  **Done when:** a `tsx` probe passes the original cases plus
  `/\evil.com`, tab-embedded variants, and `/%5Cevil.com` (allowed - stays
  same-origin); `pnpm exec tsc --noEmit` and `pnpm lint` clean.

- [x] 7. Repair F-08 (user-reported defect, signup leg only): email
  `signIn.email` gets a `{redirect:true,url}` response that the client
  `redirectPlugin` navigates on, but `signUp.email` returns `{token,user}`
  with no redirect payload, so signup never navigates. In
  `components/signup-form.tsx` only, add `router.push(callbackURL)` +
  `router.refresh()` on the success branch; `callbackURL` is already
  sanitized same-origin by the server page. Leave `login-form.tsx`
  unchanged - its redirect already works.
  **Done when:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` clean;
  live check confirms `sign-up/email` response shape is `{token,user}`
  (no `url`) while `sign-in/email` returns `redirect:true`.

## Files / areas

- `lib/session.ts` - new; server session helper + callback-path sanitizer
- `app/login/page.tsx`, `app/signup/page.tsx` - new routes
- `components/login-form.tsx`, `components/signup-form.tsx`,
  `components/account-menu.tsx` - new client components
- `proxy.ts` - new at project root (Next 16 convention; not `middleware.ts`)
- `components/site-header.tsx` - add `AccountMenu`

## Data / contracts

- Trusted actor is always the server session from `auth.api.getSession`;
  the proxy cookie check is optimistic UX only (Next's own proxy doc says
  it is not an authorization layer). Features 8 and 9 must call
  `getSession()` server-side before rendering `/checkout` or `/orders*`
  and redirect when it is null - that is a locked contract for those specs.
- Guard surface: `/checkout` and `/orders` + subpaths only. Browsing,
  search, product, cart, and the auth pages stay public (guest-first
  overview contract). `/api/auth/*` is not matched.
- Redirect contract: signed-out hit -> `/login?callbackURL=<path+search>`.
  `callbackURL` is sanitized by `toSafeCallbackPath` on the auth page before
  use, so open redirects are not possible; missing/invalid -> `/`.
- Session cookie name is `better-auth.session_token`; also accept the
  `__Secure-`-prefixed variant Better Auth sets under HTTPS so the guard
  works in production.
- Signup fields: `name`, `email`, `password` (`signUp.email` requires
  `name` - the generated `user.name` column is non-null). Password rules are
  Better Auth 1.7.5 defaults: 8-128 chars. Signup auto-signs-in (Better
  Auth default) and lands on `callbackURL`.
- Login failure (bad credentials, unknown email) renders the returned error
  inline; no generic "success" path on error. Any unexpected client-side
  failure shows a generic fallback message in the same alert region.
- Menu contract: guest -> "Hello, sign in" -> `/login`; signed-in ->
  "Hello, {user.name}" + dropdown { "Your Orders" -> `/orders` (404s until
  feature 9), "Sign out" -> signOut, navigate `/`, refresh }. No account
  page exists; do not link one.
- No user-supplied HTML anywhere; `user.name` renders as React text only.
- No new env vars, migrations, or schema changes.

## Testing

No test runner is configured (see Commands in `AGENTS.md`), so no test gate
applies. Verification is per-step commands, the step-1 `tsx` probe on
`toSafeCallbackPath`, and the step-5 live smoke. If a runner is added later,
`toSafeCallbackPath` is the in-scope pure logic.

## Notes for the AI

- This is Next.js 16.3.5: `proxy.ts` replaces `middleware.ts` (root level,
  `export function proxy(request: NextRequest)`, `export const config`).
  Confirm export shape in `16-proxy.md` before writing.
- `lib/auth-client.ts` already exports `authClient` (`better-auth/react`);
  forms import it - do not create a second client or a custom fetch layer.
- `searchParams` in server pages is a Promise in this Next version - await
  it, same pattern as existing dynamic pages.
- Match the existing hand-built Amazon look: yellow `[#febd69]`/`[#ffd814]`
  accents, dark header; auth pages get a centered card, not a layout change.
- `CartLink` is the precedent for mounted-gating a client component that
  reads browser state inside the server-rendered header.
- No test command exists; do not install a runner. No em dashes in
  generated files (coding-standards).
- Baseline before this spec: `pnpm exec tsc --noEmit` clean on `main`
  (791d98b).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10684,"specSha256":"894c56201be21f23a68e7a9f70fb28e8a36ac20a98db69c967242c1b9c78ff29","branch":"refs/heads/feature/auth-pages-and-protected-routes","head":"6a8ddb6ddad88d6ea75865a1f02759d2367e25f5","baseRef":"refs/heads/main","baseCommit":"791d98b99dc0cab8e9d6e7cbfef13fde101b0aff","sourceTree":"1e01b2001d5ebc8fa8af4c2d305d6c31d1a8649c","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 6a8ddb6ddad88d6ea75865a1f02759d2367e25f5
**Base commit:** 791d98b99dc0cab8e9d6e7cbfef13fde101b0aff
**Base ref:** main
**Spec hash:** 894c56201be21f23a68e7a9f70fb28e8a36ac20a98db69c967242c1b9c78ff29
**Prepared by:** codex
**Builder model:** SWE-2 High
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-22T18:58:04Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** unknown (runtime did not expose exact model)
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-22T19:03:01Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `pnpm lint`: pass
- `pnpm exec tsc --noEmit`: pass
- `pnpm build`: pass (compiled `/login`, `/signup` as dynamic routes, proxy registered)
- `pnpm exec tsx` probe on `toSafeCallbackPath` (21 cases): pass - all off-origin values (`//evil.com`, `https://evil.com`, `/\evil.com`, tab/LF/CR-embedded variants, `javascript:alert(1)`, arrays, `null`/`undefined`/`""`) return `/`; same-origin paths pass through
- `curl` probes against the running dev server (read-only): pass - signed-out `/checkout`, `/orders`, `/orders/abc` each return 307 to `/login?callbackURL=<path>`; signed-in `/login?callbackURL=/checkout` returns 307 `Location: /checkout`
- `POST /api/auth/sign-up/email` (throwaway user): response `{token, user}` with no `url`/`redirect` field, confirming F-08's premise and repair necessity; user row deleted afterward
- test command: unavailable (no test runner configured)

## Evidence

- `lib/session.ts:9-21` - origin check via `new URL(path, placeholder)` verified against 21 probe cases
- `components/signup-form.tsx:31-34` - `router.push(callbackURL)` + `router.refresh()` on the success branch (F-08 repair confirmed)
- `components/account-menu.tsx:60-83` - plain disclosure pattern, `aria-expanded` only, no stale menu roles
- `proxy.ts` - named `proxy` export, matcher `["/checkout", "/orders/:path*"]`, cookie check covers `__Secure-` variant
- Live 500s on signed-in `/login?callbackURL=/%0Bx`, `/%01x`, `/%7Fx`, `/%F0%9F%98%80` confirm F-06 (raw control/non-latin1 chars reach `Location` header validation)
- Builder live smoke (spec step 5): signup 200 + `better-auth.session_token` cookie, guard 307s, wrong-password 401 / correct 200, sign-out 200 + cookie cleared, test user row deleted with no orphan rows

## Findings

- 7/F-08 [P1] fixed -> closed: signup navigation repair verified in code and against live response shapes; no new defect
- 7/F-04 [P1], 7/F-05 [P3]: closed during the 1f3135c review pass; carried in this archive at final status
- F-06 [P3] unverified -> [P2] open: confirmed live; reachable only for a signed-in user's own request (self-inflicted 500, no header injection or open redirect); remains in the live ledger
- F-07 [P3] open: unchanged - Escape in the dropdown still drops focus to `document.body`; remains in the live ledger
- F-09 [P3] open: new - `authClient.signOut()` failure in `account-menu.tsx` is an unhandled rejection and a silent dead click; remains in the live ledger
- F-01, F-02, F-03: prior-feature context, unchanged; remain in the live ledger

### 7/F-04 [P1] closed - toSafeCallbackPath passes `/\host` through, enabling an open redirect

**File:** lib/session.ts:13 (reachable via app/login/page.tsx:11, app/signup/page.tsx:11)
**Found:** 2026-09-22 by /audit independent (scope: current; lens: security)
**Why it matters:** the sanitizer only rejects `//`-prefixed values, but WHATWG URL parsing treats `\` as a path separator for special schemes, so `new URL("/\\evil.com", "https://shop.example").href` resolves to `https://evil.com/` (verified with node). A signed-in user opening `/login?callbackURL=/\attacker.com` or `/signup?callbackURL=/\attacker.com` is `redirect()`ed off-site, which breaks the spec contract "callbackURL is sanitized ... so open redirects are not possible" and gives a phishing-ready redirect on an auth page. The same sanitized value is also passed to `authClient.signIn.email`/`signUp.email` as `callbackURL`; Better Auth's own trusted-origin validation may catch that path (defense in depth, not verified), but the server-side `redirect()` in both pages has no second check.
**Suggested fix:** tighten the check to reject `\` (and ideally any character the URL parser treats as a separator), for example `if (path && path.startsWith("/") && !path.startsWith("//") && !path.includes("\\")) return path;`, or validate with `new URL(path, <app origin>)` and require the resolved origin to stay on-origin. Extend the step-1 `tsx` probe with `/\evil.com`.
**Resolution:** repaired 2026-09-22 via spec step 6 - `toSafeCallbackPath` now parses the value with `new URL(path, "https://placeholder.local")` and rejects any value that resolves off-origin, covering `\`, stripped-tab, and future parser quirks rather than a character denylist. Probe covers `/\evil.com`, `/`+tab+`/evil.com`, `//evil.com`, `/%5Cevil.com` (allowed), plus the original cases; all pass.
Re-reviewed 2026-09-22 by /audit independent (fresh reviewer, commit 1f3135c): confirmed at lib/session.ts:13-21. Reviewer ran a 19-case `tsx` probe: `/\evil.com`, `/\\evil.com`, tab/LF/CR-stripped `//evil.com` variants, `//evil.com`, `https://evil.com`, `javascript:alert(1)`, array inputs, `null`/`undefined`/`""` all rejected to `/`; same-origin paths (`/checkout?x=1`, `/orders/abc?x=1&y=2`, `/%5Cevil.com`, `/%2f%2fevil.com`, `/foo\bar`) pass through unchanged. Original defect gone; no new defect introduced by the repair. A residual edge (raw control characters surviving in the returned string) is recorded separately as F-06. Closed.

### 7/F-05 [P3] closed - Account dropdown declares ARIA menu semantics it does not implement

**File:** components/account-menu.tsx:62,70
**Found:** 2026-09-22 by /audit independent (scope: current; lens: quality)
**Why it matters:** `role="menu"`, `role="menuitem"`, and `aria-haspopup="menu"` announce the ARIA menu pattern, which carries keyboard expectations (arrow-key navigation, roving tabindex, focus management) the component does not implement. Tab still reaches the items and Escape/outside click close it, so the widget works, but the declared semantics mislead assistive tech.
**Suggested fix:** either implement the menu keyboard semantics, or drop `role="menu"`/`role="menuitem"`/`aria-haspopup="menu"` and keep it a plain disclosure dropdown (the existing `aria-expanded` on the button is sufficient).
**Resolution:** repaired 2026-09-22 - dropped `role="menu"`, `role="menuitem"`, and `aria-haspopup="menu"`; the dropdown is now a plain disclosure (`aria-expanded` retained).
Re-reviewed 2026-09-22 by /audit independent (fresh reviewer, commit 1f3135c): confirmed at components/account-menu.tsx:60-83 - no `role="menu"`, `role="menuitem"`, or `aria-haspopup` remain; `aria-expanded` on the trigger is the only state semantics, matching a plain disclosure pattern. Items stay Tab-reachable and Escape/outside-pointerdown still close. Original defect gone; no new defect introduced. A residual keyboard edge (Escape while focus is inside the dropdown drops focus to body) is recorded separately as F-07. Closed.

### 7/F-08 [P1] closed - Email sign-up never navigates; user stays on the signup page

**File:** components/signup-form.tsx:22-30
**Found:** 2026-09-22 reported by user (post-auth redirect missing); narrowed by live evidence 2026-09-22
**Why it matters:** `signUp.email` returns `{ token, user }` with no `url`/`redirect` fields (verified live: `POST /api/auth/sign-up/email` with `callbackURL` returns no redirect payload), so the client `redirectPlugin` never fires and the user stays on `/signup`, breaking the spec contract "Signup auto-signs-in and lands on callbackURL". Login is NOT affected: `POST /api/auth/sign-in/email` returns `{"redirect":true,"url":...}` and the plugin navigates correctly.
**Suggested fix:** on a successful (no-error) result in `signup-form.tsx` only, navigate explicitly with `router.push(callbackURL)` + `router.refresh()`; the value is already sanitized to a same-origin path by the server page.
**Resolution:** repaired 2026-09-22 via spec step 7 - `signup-form.tsx` navigates with `router.push(callbackURL)` + `router.refresh()` on the success branch; `login-form.tsx` intentionally unchanged (its server-side `redirect:true` response drives the client plugin). tsc/lint/build clean; live curl confirmed the differing response shapes.
Re-reviewed 2026-09-22 by /audit independent (fresh reviewer, commit 6a8ddb6): confirmed at components/signup-form.tsx:31-34 - the no-error branch calls `router.push(callbackURL)` then `router.refresh()`; `callbackURL` is the server-sanitized same-origin path so the push cannot navigate off-origin. Live `POST /api/auth/sign-up/email` reconfirmed the response is `{token, user}` with no `url`/`redirect` field, so the explicit navigation is the correct repair and login-form.tsx's plugin-driven path is correctly untouched. Original defect gone; no new defect introduced by the repair. Closed.

## Remaining risk

- `.agent-logs/` transcript artifacts (one tracked modification, one untracked file) differ from target; treated as out-of-scope runtime noise per the feature-02 precedent
- No test runner is configured (deliberate project decision); `toSafeCallbackPath` logic is verified only by the `tsx` probe, not a repeatable test gate
- Browser-level flows (dropdown interaction, form submit, post-signup navigation) were verified by code review plus curl response shapes, not a real browser session
- No rate-limiting or brute-force protection on `/api/auth/*` was verified; Better Auth defaults were not audited in this pass
- F-06 [P2] confirmed: signed-in `/login`/`/signup` with a control-char or non-latin1 `callbackURL` 500s; repair suggestion recorded in the live ledger (return `parsed.pathname + search + hash` or strip `[\x00-\x1f\x7f]`)
