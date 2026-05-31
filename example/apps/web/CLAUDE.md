# CLAUDE.md - Tindo web

The customer dashboard: list and create invoices, see payment status, reconcile. A
thin Next.js (App Router) client over the API - it renders and collects input; it does
not own business rules.

## Commands

```bash
pnpm dev          # next dev on :3000
pnpm build        # next build
pnpm test         # vitest + testing-library
pnpm lint         # eslint + tsc --noEmit
```

## Architecture (load-bearing rules)

1. **The API owns the truth; the web app never re-implements a rule.** Totals, tax,
   what "paid" means - all come from the API. Why: two copies of a money rule drift,
   and the UI's copy will be the wrong one.
2. **Server Components fetch; Client Components interact.** Data loading happens on the
   server (no secrets or tokens in the bundle); add `"use client"` only for actual
   interactivity. Why: keeps the bundle small and credentials server-side.
3. **Show money exactly as the API sends it.** Format the integer minor units for
   display; never do arithmetic on amounts in the browser. Why: see rule 1.
4. **Every async UI has loading and error states.** No silent spinners that hang, no
   unhandled rejection. Why: a billing tool that looks frozen loses trust fast.

## Patterns to follow

- **Data fetching in Server Components** or route handlers; mutations via server
  actions that call the API. Components stay declarative.
- **One API client module.** All calls go through it (auth header, base URL, typed
  responses, error mapping) - components never `fetch` raw.
- **Copy is es-CL** and lives with the component or in the locale file, not hardcoded
  in random places.

## Anti-patterns (do NOT)

- Computing or "fixing up" a total in the browser -> render what the API returns.
- Putting an API token or secret in a Client Component or `NEXT_PUBLIC_` var -> it
  ships to the browser. Server-side only.
- A fetch with no error branch -> every call handles failure and shows it.
