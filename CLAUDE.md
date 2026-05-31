# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Next.js dev server with Turbopack

# Build & production
npm run build
npm run start

# Database
npm run db:setup     # Interactive setup — writes .env from prompts
npm run db:generate  # Generate Drizzle migration from schema changes
npm run db:migrate   # Apply migrations to the database
npm run db:seed      # Seed a test user
npm run db:studio    # Open Drizzle Studio (browser DB UI)

# Stripe (run in a separate terminal during dev)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

No test suite is configured. TypeScript checking: `npx tsc --noEmit`.

## Architecture

This is a **Next.js 15 App Router SaaS frontend** for the MCP Bypass service — a wallet-based proxy that lets users pay for Claude API calls in EUR. It was forked from `nextjs/saas-starter` and substantially rewritten; many original team/subscription patterns are gone.

### Two data stores

**PostgreSQL via Drizzle ORM** (`lib/db/drizzle.ts`, `lib/db/schema.ts`) — system of record for users, token usage history, and activity logs. Tables: `users`, `token_usages`, `activity_logs`.

**Redis via ioredis** (`lib/db/redis.ts`) — real-time wallet state. The MCP Bypass Server owns and writes these keys; this frontend reads and occasionally writes them:
- `wallet:balance:{apiKey}` — live balance (string, USD)
- `wallet:stats:{apiKey}` — aggregate stats hash
- `wallet:calls:{apiKey}` — recent call log list (capped at 500)
- `fx:eur_usd` — cached exchange rate (TTL 1h)
- `payment:processed:{paymentIntentId}` — idempotency guard for Stripe events

### Auth

JWT-based sessions stored in `httpOnly` cookies. `lib/auth/session.ts` handles signing/verifying with `jose` + `AUTH_SECRET`. `lib/auth/middleware.ts` exports two Server Action wrappers: `validatedAction` (Zod schema + no user required) and `validatedActionWithUser` (Zod schema + authenticated user injected). Route protection lives in `middleware.ts` — only `/dashboard/**` is protected.

### Payment flow

Stripe Checkout (one-time payment, not subscription). EUR amounts from the pricing page → `lib/payments/actions.ts` → `lib/payments/stripe.ts` creates a Checkout session → on return, `app/api/stripe/checkout/route.ts` (GET redirect handler) and `app/api/stripe/webhook/route.ts` (POST webhook) both credit the wallet. Redis idempotency key (`payment:processed:{paymentIntentId}`) prevents double-crediting if both fire. Balances stored as USD in Postgres; displayed as EUR using a cached FX rate (`lib/fx/rates.ts`).

### Email

SendGrid via `@sendgrid/mail` (`lib/email/sendgrid.ts`). Three transactional emails: email verification, password reset, deposit confirmation. Requires `SENDGRID_API_KEY` and `FROM_EMAIL` env vars.

### Data flow for the dashboard

`app/(dashboard)/dashboard/page.tsx` fetches from two API routes via SWR:
- `GET /api/wallet` — reads Redis stats/calls + Postgres balance + FX rate
- `GET /api/user` — reads Postgres user row from session

### Route groups

- `app/(dashboard)/` — public layout with header; landing page + pricing
- `app/(dashboard)/dashboard/` — protected dashboard with sidebar nav (Wallet, General, Activity, Security)
- `app/(login)/` — sign-in and sign-up pages sharing `login.tsx`

## Known gaps

The landing page (`app/(dashboard)/page.tsx`) and header (`app/(dashboard)/layout.tsx`) still contain generic saas-starter copy and "ACME" branding — intentionally left for the owner to customise.

## Environment variables

```
POSTGRES_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@yourdomain.com
BASE_URL=http://localhost:3000
AUTH_SECRET=<random 32-byte base64>
```

## Database schema ownership

This app owns creation of all tables: `users`, `user_preferences`, `token_usages`, `activity_logs`, `debug_logs`. Run `npm run db:migrate` on a fresh database to create them all. The migration in `lib/db/migrations/0000_soft_the_anarchist.sql` reflects the current `lib/db/schema.ts` exactly.
