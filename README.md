# i3City

An online store for i3City, a gadget and phone accessory shop. It is a fast, mobile-first storefront with nationwide delivery, WhatsApp checkout, and an admin dashboard the owner can run from a phone.

- **Storefront:** home, shop, categories, search, product pages, cart, checkout, order tracking.
- **WhatsApp checkout:** the order is saved, then the customer is sent to WhatsApp with a prefilled message. The owner confirms, collects payment and moves the order through to delivered.
- **Admin:** dashboard analytics, products (with photos, CSV import and export), categories, orders, delivery rates and store settings.
- **Payments:** card and transfer payments with Paystack, or pay after confirming on WhatsApp.

Read [`PRD.md`](./PRD.md) for scope and phases, [`DESIGN.md`](./DESIGN.md) for the design system, and [`CLAUDE.md`](./CLAUDE.md) for the engineering conventions.

## Tech stack

| Layer    | Choice                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| Monorepo | pnpm workspaces, Turborepo                                                            |
| Web      | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui on Base UI   |
| Web data | axios, TanStack Query and Table, Zustand (cart), NextAuth 4, zod, date-fns            |
| API      | NestJS 12, TypeScript, class-validator, zod for environment variables                 |
| Database | PostgreSQL 17 with Prisma 7                                                           |
| Images   | Cloudflare R2 (S3-compatible), uploaded straight from the browser with presigned URLs |
| Email    | Resend (optional in development)                                                      |
| Tests    | Vitest (unit and end-to-end)                                                          |
| CI       | GitHub Actions                                                                        |

## Repository layout

```
apps/
  web/            Next.js storefront and admin
  api/            NestJS API, Prisma schema and seed scripts
packages/
  types/          Shared types, API envelope, shipping and phone helpers
  eslint-config/  Shared ESLint configuration
  typescript-config/  Shared tsconfig files
design-lab/       Design explorations (not part of the build)
docker-compose.yml  Local PostgreSQL
```

## Getting started

### Prerequisites

- Node.js 24 or later
- pnpm 11 (`corepack enable` picks the right version)
- PostgreSQL 17. Either Docker, or a local server such as Postgres.app

### 1. Install

```sh
pnpm install
```

This also generates the Prisma client.

### 2. Start a database

With Docker:

```sh
pnpm db:up
```

The container listens on port 5433, so it does not clash with a local Postgres on 5432. With a local server instead, create a database named `i3city`.

### 3. Configure the API

Copy `apps/api/.env.example` to `apps/api/.env` and fill it in.

| Variable                                                                                       | Notes                                                                                                         |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                 | For the Docker database: `postgresql://i3city:i3city@localhost:5433/i3city`                                   |
| `JWT_SECRET`                                                                                   | At least 32 characters. Generate with `openssl rand -base64 48`                                               |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                                                                | Used once by the seed script to create the admin account                                                      |
| `WEB_URL`                                                                                      | The web app origin, default `http://localhost:3000`. Used for CORS and email links                            |
| `PORT`                                                                                         | Default `4000`                                                                                                |
| `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS`                                           | Optional. Defaults 900 and 7                                                                                  |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Product photos. Optional in development, required in production                                               |
| `RESEND_API_KEY`, `EMAIL_FROM`                                                                 | Order emails. Without a key, emails are skipped                                                               |
| `PAYSTACK_SECRET_KEY`                                                                          | Paystack secret key (`sk_test_...` while testing). Needed before card payments can be switched on in Settings |

The API validates its environment on startup and lists every problem at once.

### 4. Configure the web app

Copy `apps/web/.env.example` to `apps/web/.env.local`.

| Variable               | Notes                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| `NEXTAUTH_SECRET`      | At least 32 characters                                               |
| `NEXTAUTH_URL`         | `http://localhost:3000`                                              |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:4000/api`                                          |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000`                                              |
| `NEXT_PUBLIC_CDN_URL`  | The public URL of the R2 bucket, so Next can optimise product photos |

### 5. Create the schema and seed data

```sh
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

The seed adds six categories, eleven sample products, delivery rates for all 36 states and the FCT, store settings and the admin user.

### 6. Run

```sh
pnpm dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin (sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`)
- API health check: http://localhost:4000/api/health

Before taking real orders, open **Admin, Settings** and set the real WhatsApp number, support email and bank details, then review the rates under **Delivery**.

## Scripts

Run from the repository root.

| Command                      | What it does                                    |
| ---------------------------- | ----------------------------------------------- |
| `pnpm dev`                   | Runs the web app and the API with watch mode    |
| `pnpm build`                 | Builds everything                               |
| `pnpm lint`                  | Lints every package                             |
| `pnpm check-types`           | Type-checks every package                       |
| `pnpm test`                  | Runs the unit tests                             |
| `pnpm db:up`, `pnpm db:down` | Starts and stops the local PostgreSQL container |
| `pnpm format`                | Formats TypeScript and Markdown with Prettier   |

Database and API scripts run from `apps/api`, or with `pnpm --filter api <script>`.

| Command                         | What it does                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `db:migrate`                    | Creates and applies a development migration                                       |
| `db:deploy`                     | Applies migrations without prompts (CI and production)                            |
| `db:seed`                       | Seeds categories, products, rates, settings and the admin user. Safe to run again |
| `db:seed:demo`, `db:clear:demo` | Adds or removes 110 fake orders so the dashboard has data                         |
| `db:studio`                     | Opens Prisma Studio                                                               |
| `db:reset`                      | Drops the database and starts again                                               |
| `test:e2e`                      | Runs the API end-to-end tests against the database                                |

## Testing

```sh
pnpm test
pnpm --filter api test:e2e
```

The end-to-end tests use the real database in `DATABASE_URL`, create their own data with a unique prefix and clean up after themselves. Image storage and email are replaced with fakes, so no R2 credentials are needed.

## Continuous integration

Every push to `main` and every pull request runs lint, type-check and build, migrates and seeds a fresh PostgreSQL, then runs the unit and end-to-end tests. See `.github/workflows/ci.yml`.

## Product photos

Photos upload directly from the browser to R2. The bucket needs a CORS rule that allows `PUT` from the web origin and the `Content-Type` header. In production, serve the bucket from a custom domain, not the `r2.dev` URL.

## Card payments with Paystack

1. Set `PAYSTACK_SECRET_KEY` in `apps/api/.env` and restart the API.
2. In **Admin, Settings**, turn on "Card and transfer with Paystack".
3. In the Paystack dashboard (Settings, API Keys and Webhooks), set the webhook URL to `https://<your-api-domain>/api/payments/paystack/webhook`. To try it on your machine, expose the API with a tunnel such as ngrok or Cloudflare Tunnel and use that address.

Customers can then pay by card at checkout, or from the "Pay with card or transfer" button on an unpaid WhatsApp order. We hold the items for 30 minutes. A payment confirms the order automatically, whether the customer returns to the site or only the webhook arrives. Unpaid card orders are cancelled after 30 minutes and their stock is released.

## How orders work

1. The customer fills the cart and checks out. The API recomputes prices, delivery and stock from the database, ignoring anything the browser sends.
2. The order is created in one transaction that claims stock safely, so two customers cannot buy the last unit.
3. The customer lands on the confirmation page and is sent to WhatsApp with the order message.
4. The owner confirms in **Admin, Orders**, shares payment details with the ready-made message, marks the order paid, packs it, ships it with courier details and marks it delivered. Cancelling an order puts the items back in stock.

## Project status

Phases 0 to 4 are complete: setup, catalog and admin, storefront, checkout with WhatsApp orders, and Paystack payments. Next up is launch polish (Phase 5): structured data, analytics, error monitoring, legal pages and the production deployment. The checklist lives in [`PRD.md`](./PRD.md).

## Conventions

- TypeScript strict mode, no `any`, and no code comments.
- Business logic lives in NestJS services. Controllers stay thin and return plain values. The API wraps every response in one envelope.
- Shared types and helpers live in `packages/types`. Environment variables are read only through the zod-validated modules.
- Styling uses the design tokens only. See [`DESIGN.md`](./DESIGN.md).
- Commits are small, with a short conventional subject and no body.
