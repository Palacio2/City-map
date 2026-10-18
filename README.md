# Kvartals / City-Maps

Urban analytics application: React/Vite frontend, Supabase PostgreSQL and Edge Functions, and a Node.js parser backend in `server/`.

## Development

Use Node.js 24 or newer. Install dependencies with `npm ci` and `npm ci --prefix server`. Configure local environment variables outside Git, then run `npm run dev`. Frontend configuration is validated in `src/config/env.ts`; backend configuration is in `server/config/env.js`.

Never place a Supabase secret/service-role key or Stripe private key in a `VITE_*` variable. The Stripe account is shared: billing operations must remain scoped to City-map ownership.

## Verification

- `npm run check`: lint, frontend tests, security tests, TypeScript and production build.
- `npm run check:edge`: Edge type checks, offline Deno tests and dependency audit.
- `npm test --prefix server`: backend tests.
- `node scripts/check-secrets.mjs`: credential-pattern scan; outputs paths only, never matched secrets.
- `node scripts/check-security.mjs --list`: list the security suites. New `supabase/tests/*.test.mjs` and `*.test.ts` files are discovered automatically; Deno/live smoke tests stay separate.
- `npm run check:db:clean`: isolated database restore check; requires Docker and a complete baseline.

Generate temporary verification logs under ignored `logs/`. Keep regression tests and migrations in Git, not captured database responses or one-off diagnostic scripts.

## Release state

Start with [release status](docs/audit/2026-10-15/REMEDIATION.uk.md) and [database rollout](docs/DATABASE-ROLLOUT.uk.md). A successful build is not evidence that pending migrations have been deployed or that backup restoration works. Do not reset a linked production database.
