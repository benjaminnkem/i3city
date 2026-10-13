# i3City Online Store: Product Requirements Document

## 1. Overview

i3City is a physical retail store at Egbeda selling gadgets, phone accessories and related electronics. This project takes the business online: a fast, mobile-first storefront with nationwide delivery, WhatsApp checkout at launch, Paystack card and transfer payments, and an admin dashboard the owner can run without a developer.

Owner and primary admin: the store owner (Benjamin's sister).
Builder: Benjamin.

## 2. Goals and non-goals

### Goals

- Customers anywhere in Nigeria can browse, order and pay for products.
- Launch with WhatsApp checkout, then add Paystack without restructuring anything.
- Owner manages products, stock, orders, shipping rates and store settings from a phone.
- Loads fast on mid-range Android phones and unstable networks.
- Stock stays accurate across online orders and the physical store.

### Non-goals for v1

- Multi-vendor marketplace
- Customer accounts and login (guest checkout only)
- Product variants (colour, storage size)
- Native mobile app
- Discount codes, reviews, wishlists
- Automated courier booking

## 3. Users and roles

| Role     | Description                             | Access                                     |
| -------- | --------------------------------------- | ------------------------------------------ |
| Customer | Anonymous visitor who orders as a guest | Storefront, cart, checkout, order tracking |
| Admin    | Store owner                             | Full dashboard                             |

A single admin account at launch. The schema should allow adding staff later.

## 4. Tech stack

| Layer      | Choice                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------- |
| Monorepo   | pnpm workspaces                                                                             |
| Web        | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, TanStack Query, Zustand                |
| API        | NestJS 12, TypeScript                                                                       |
| Database   | PostgreSQL 17 with Prisma 7 (`@prisma/adapter-pg`)                                          |
| Auth       | API-issued JWT access tokens and refresh tokens, NextAuth 4 on the web                      |
| Payments   | Paystack                                                                                    |
| Images     | Cloudflare R2 (S3-compatible) behind a custom domain                                        |
| Email      | Resend                                                                                      |
| Hosting    | Vercel (web), Railway or Render (API), Neon (Postgres)                                      |
| HTTP       | axios on the web, through one shared client in `apps/web/lib/api.ts`                        |
| Validation | class-validator on the API, zod on the web forms and for environment variables in both apps |

### Repository layout

```
i3City/
  apps/
    web/
    api/
  packages/
    types/
  design-lab/
  docker-compose.yml
  pnpm-workspace.yaml
  PRD.md
  DESIGN.md
  CLAUDE.md
```

`packages/types` holds shared DTO types and enums consumed by both apps. `design-lab/` holds the design explorations and is not part of the build.

### Environment variables

API:

```
PORT
DATABASE_URL
JWT_SECRET
ACCESS_TOKEN_TTL_SECONDS
REFRESH_TOKEN_TTL_DAYS
ADMIN_EMAIL
ADMIN_PASSWORD
WEB_URL
PAYSTACK_SECRET_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
RESEND_API_KEY
EMAIL_FROM
```

`JWT_SECRET` must be at least 32 characters. `ACCESS_TOKEN_TTL_SECONDS` defaults to 900 and `REFRESH_TOKEN_TTL_DAYS` to 7. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are read by the seed script only.

Web:

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_CDN_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
```

### Image storage

- Bucket: one private-write R2 bucket, public reads through a custom domain such as `cdn.<domain>`. Do not use the `r2.dev` URL in production.
- Uploads: the admin browser posts the photo (up to 25 MB, any common format) as multipart to the API. The API optimises it with sharp (EXIF rotation, max 1600px on the long edge, WebP, metadata stripped, under 5 MB) and writes it to R2 with the S3 SDK pointed at the R2 endpoint (`https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`) and an immutable cache header. Encoding happens on the server because iOS browsers cannot encode WebP from a canvas.
- Object keys: `products/<uuid>.webp`. Only the key is allowed from the client, the API builds the final URL from `R2_PUBLIC_URL`.
- Storefront renders images with `next/image`, with the CDN host in `remotePatterns`, so responsive sizes are generated on demand.
- Deleting a product image or a product removes the object from R2.

## 5. Phased delivery

Each phase ends in something deployable. Do not start a phase until the previous one meets its acceptance criteria.

### Phase 0: Setup

- [x] Initialise the pnpm monorepo, TypeScript strict mode, ESLint, Prettier.
- [x] Scaffold `apps/web` and `apps/api`.
- [x] Scaffold `packages/types`, built with `tsc` to `dist` and consumed by both apps.
- [x] Prisma schema, migrations, seed script (categories, sample products, shipping rates, store settings, admin user).
- [x] Docker Compose for local Postgres.
- [x] CI: lint, typecheck and build on every push, with a Postgres service for the API e2e tests.
- [x] Write `CLAUDE.md` from section 14.

Acceptance: `pnpm dev` runs both apps, the API connects to the database, seed runs cleanly, CI is green.

### Phase 1: Catalog and admin

- [x] Admin authentication: API login, refresh, logout and `/auth/me`, NextAuth sign-in at `/admin/login`, protected `/admin` layout.
- [x] Category and product CRUD with direct-to-R2 image upload (multiple images, reorder, set primary, client-side resize and WebP conversion).
- [x] Stock tracking, low stock list, active/inactive and featured toggles, inline stock edits and bulk show, hide and delete.
- [x] Admin dashboard analytics: revenue and order trends, order status mix, top products, category spread, inventory health and low stock.
- [x] CSV import and export of products: download template, preview with per-row errors, update by SKU, new categories created on import.
- [x] Admin shell, responsive and usable on a phone: sidebar, theme toggle, account menu.
- [x] Category management screens: list, add, edit, reorder, delete.

Acceptance: the owner can log in, add a product with photos from her phone, and see it in the product list.

### Phase 2: Storefront

- [x] Home, shop listing, category pages, search, product detail.
- [x] Server-rendered pages with metadata, sitemap and robots.
- [x] Cart (persisted locally with Zustand), cart page, revalidated against the API.
- [x] Empty, loading and error states throughout.
- [ ] Lighthouse mobile performance check on home and product pages.

Acceptance: a visitor can find a product, view it and fill a cart. Lighthouse mobile performance 90 or higher on home and product pages.

### Phase 3: Checkout, shipping and WhatsApp orders

- [x] Checkout form with state-based shipping fee calculation.
- [x] Server-side order creation with price and stock verification.
- [x] WhatsApp checkout: order saved, customer redirected to WhatsApp with a prefilled message.
- [x] Order confirmation and public tracking page.
- [x] Admin orders: list, filters, detail, status updates, courier and tracking number, mark as paid, cancel with automatic restock, packing slip, copyable WhatsApp messages.
- [x] Admin shipping rates and store settings.
- [x] Order notification email to the owner and confirmation email to the customer when an email is provided, and a shipped notice. Emails are sent with Resend when `RESEND_API_KEY` is set and skipped otherwise.

Acceptance: end-to-end order via WhatsApp works, the owner sees it in the dashboard and moves it through to delivered, stock adjusts correctly, cancelling restores stock.

### Phase 4: Paystack

- [x] Paystack as a second payment method at checkout. The owner turns it on in Admin, Settings once `PAYSTACK_SECRET_KEY` is set on the API. An email is required for card orders.
- [x] Initialise, callback verification, webhook with signature check (`POST /api/payments/paystack/webhook`, HMAC SHA512 over the raw body).
- [x] "Pay with card or transfer" link on unpaid WhatsApp orders (`POST /api/orders/:code/pay`).
- [x] Auto-cancel unpaid Paystack orders after 30 minutes and release stock. A scheduler runs every minute, verifies with Paystack before cancelling, and flags late payments on cancelled orders to the owner.

Acceptance: a test-mode payment marks the order paid exactly once, whether the callback, the webhook or both fire. A tampered amount is rejected.

Status: the flow is covered by API end-to-end tests with a signed webhook and a fake Paystack, and the Paystack test API has been exercised for initialise and verify. Completing a test card payment on Paystack's hosted page is the one step to confirm by hand.

### Phase 5: Polish and launch

- [x] SEO: product, store, website, breadcrumb and item list JSON-LD, default Open Graph image, canonical URLs, noindex for search results, web manifest and icon.
- Analytics and Meta Pixel.
- Rate limiting, security headers, error monitoring (Sentry).
- [x] Legal pages: delivery policy, returns policy, privacy. The returns window (48 hours for faults, 3 days for unopened items) is a default for the owner to confirm.
- Custom domain, production environment, backups.
- Owner walkthrough and short admin guide.

Acceptance: production deployed, a real low-value order placed and refunded successfully.

## 6. Functional requirements

### 6.1 Storefront

- Home: hero, category entry points, featured products, new arrivals, delivery and support strip, WhatsApp contact.
- Shop: grid with category filter, price range, in-stock filter, sort (newest, price low to high, price high to low), search, pagination.
- Product page: image gallery, name, price, compare-at price with saving shown, stock state, quantity selector, add to cart, description, brand, related products, share link, "Ask on WhatsApp" button prefilled with the product name and URL.
- Out-of-stock products stay visible but cannot be added to the cart.
- All prices in naira, formatted consistently.

### 6.2 Cart

- Stored in localStorage via Zustand.
- Quantity capped at available stock.
- On cart load and at checkout, prices and stock are revalidated against the API. Changes are flagged to the customer.

### 6.3 Checkout

- Fields: full name, phone, email (required for Paystack, optional for WhatsApp), delivery address, city, state, order note.
- Nigerian phone number validation.
- State selection drives the shipping fee. Free shipping above the configured threshold.
- Payment method choice: WhatsApp, Paystack (Paystack hidden until enabled in settings).
- Order summary with subtotal, shipping and total always visible.

### 6.4 Orders

- The server recomputes everything from the database. Client prices are never trusted.
- Order code format: `I3-XXXXXX`, unambiguous characters only.
- Stock is decremented when the order is created and restored on cancellation or expiry.
- Public tracking page by order code showing items, totals, status timeline, courier and tracking number. No address or phone shown.

### 6.5 Admin

- Dashboard: orders today, new orders awaiting action, paid revenue (7 and 30 days), low stock products.
- Products: table with search and filters, create and edit form, bulk activate and deactivate, CSV import and export.
- Categories: create, rename, reorder, delete (products become uncategorised).
- Orders: filter by status and payment status, search by code, name or phone, detail drawer, status transitions, mark paid, cancel, copy customer WhatsApp link, print packing slip.
- Shipping: rate per state with estimated delivery days, default fee, free shipping threshold.
- Settings: store name, WhatsApp number, support email, store address and opening hours, payment methods enabled.
- Login with email and password. The API issues a short-lived access token (15 minutes) and a refresh token (7 days, stored hashed and revocable). The web app uses NextAuth with the credentials provider and keeps both tokens in its encrypted httpOnly session cookie, renewing the access token before it expires.

### 6.6 Notifications

- Owner: email on every new order.
- Customer: email confirmation and shipped notice when an email exists.
- WhatsApp message templates for the owner to copy: payment details, shipped update.

## 7. Data model

```prisma
enum OrderStatus {
  PENDING_PAYMENT
  AWAITING_CONFIRMATION
  CONFIRMED
  PACKED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  WHATSAPP
  PAYSTACK
}

enum PaymentStatus {
  UNPAID
  PAID
  FAILED
  REFUNDED
}

model AdminUser {
  id            String         @id @default(cuid())
  email         String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id          String    @id @default(cuid())
  tokenHash   String    @unique
  adminUserId String
  adminUser   AdminUser @relation(fields: [adminUserId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([adminUserId])
}

model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  sortOrder Int       @default(0)
  products  Product[]
}

model Product {
  id             String      @id @default(cuid())
  name           String
  slug           String      @unique
  description    String      @default("")
  price          Int
  compareAtPrice Int?
  stock          Int         @default(0)
  sku            String?     @unique
  brand          String?
  images         String[]
  featured       Boolean     @default(false)
  active         Boolean     @default(true)
  categoryId     String?
  category       Category?   @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  orderItems     OrderItem[]
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([categoryId])
  @@index([active, featured])
}

model Order {
  id             String        @id @default(cuid())
  code           String        @unique
  customerName   String
  phone          String
  email          String?
  address        String
  city           String
  state          String
  note           String?
  items          OrderItem[]
  events         OrderEvent[]
  subtotal       Int
  shippingFee    Int
  total          Int
  paymentMethod  PaymentMethod
  paymentStatus  PaymentStatus @default(UNPAID)
  status         OrderStatus
  paystackRef    String?       @unique
  paidAt         DateTime?
  courier        String?
  trackingNumber String?
  expiresAt      DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([status, createdAt])
  @@index([phone])
}

model OrderEvent {
  id        String      @id @default(cuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())

  @@index([orderId, createdAt])
}

model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  name      String
  price     Int
  quantity  Int
  image     String?
}

model ShippingRate {
  id      String  @id @default(cuid())
  state   String  @unique
  fee     Int
  etaDays String?
}

model StoreSettings {
  id                 Int     @id @default(1)
  storeName          String  @default("i3City")
  whatsappNumber     String
  supportEmail       String?
  address            String?
  openingHours       String?
  bankDetails        String?
  defaultShippingFee Int     @default(5000)
  freeShippingOver   Int?
  paystackEnabled    Boolean @default(false)
}
```

The datasource block has no URL because Prisma 7 reads `DATABASE_URL` from `prisma.config.ts`, and the client is generated to `apps/api/src/generated/prisma` and is not committed. Admin emails are stored lowercase.

All money is stored as integer naira. Order items snapshot name, price and image at purchase time.

## 8. API

Prefix `/api`. Admin routes require a valid admin token sent as `Authorization: Bearer <accessToken>`.

### Response format

Every JSON response uses one envelope, typed in `@repo/types`. Empty responses (HTTP 204) have no body.

```json
{ "success": true, "data": { "status": "ok" } }
```

Lists add pagination metadata:

```json
{
  "success": true,
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 }
}
```

Errors keep the HTTP status code and add a stable code for clients to branch on. `details` appears on validation errors only, with one entry per invalid field.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "messages": ["email must be an email"] }]
  }
}
```

Error codes: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `PAYLOAD_TOO_LARGE`, `TOO_MANY_REQUESTS`, `INTERNAL_SERVER_ERROR`, `SERVICE_UNAVAILABLE`. The envelope is applied by a global interceptor and exception filter, so controllers return plain values, or a `Paginated` result for lists, and throw standard Nest exceptions.

### Public

| Method | Path                         | Purpose                                                                                       |
| ------ | ---------------------------- | --------------------------------------------------------------------------------------------- |
| GET    | `/products`                  | List with `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`    |
| GET    | `/products/:slug`            | Product detail with related products                                                          |
| GET    | `/categories`                | Categories with product counts                                                                |
| GET    | `/settings/public`           | Store name, WhatsApp number, shipping rates, free shipping threshold, enabled payment methods |
| POST   | `/orders`                    | Create order, returns order plus `whatsappUrl` or Paystack `authorizationUrl`                 |
| GET    | `/orders/:code`              | Public order view without personal details                                                    |
| POST   | `/orders/:code/pay`          | Start Paystack payment for an existing unpaid order                                           |
| GET    | `/orders/:code/verify`       | Verify a Paystack reference after redirect                                                    |
| POST   | `/payments/paystack/webhook` | Paystack webhook                                                                              |
| POST   | `/cart/validate`             | Revalidate cart items against current price and stock                                         |

### Admin

| Method             | Path                      | Purpose                                                 |
| ------------------ | ------------------------- | ------------------------------------------------------- |
| POST               | `/auth/login`             | Issue access and refresh tokens                         |
| POST               | `/auth/refresh`           | Exchange a refresh token for a new access token         |
| POST               | `/auth/logout`            | Revoke the refresh token                                |
| GET                | `/auth/me`                | Current admin from the access token                     |
| GET                | `/admin/stats`            | Dashboard figures                                       |
| GET, POST          | `/admin/products`         | List (search, filters, sort, pagination) and create     |
| POST               | `/admin/products/delete`  | Bulk delete, removes the photos from R2                 |
| POST               | `/admin/products/status`  | Bulk activate or deactivate                             |
| GET, PATCH, DELETE | `/admin/products/:id`     | Read, update, delete                                    |
| POST               | `/admin/products/import`  | CSV import                                              |
| GET                | `/admin/products/export`  | CSV export                                              |
| GET, POST          | `/admin/categories`       | List and create                                         |
| PUT                | `/admin/categories/order` | Reorder with the full list of ids                       |
| PATCH, DELETE      | `/admin/categories/:id`   | Update, delete                                          |
| GET                | `/admin/orders`           | List with filters                                       |
| GET                | `/admin/orders/:id`       | Detail                                                  |
| PATCH              | `/admin/orders/:id`       | Update status, payment status, courier, tracking number |
| GET, PUT           | `/admin/shipping-rates`   | Read and replace rates                                  |
| GET, PUT           | `/admin/settings`         | Read and update store settings                          |
| POST               | `/admin/uploads`          | Multipart photo, optimised to WebP, stored in R2        |
| DELETE             | `/admin/uploads`          | Remove an object from R2 by key                         |

## 9. Payment flows

### WhatsApp checkout

1. Customer submits checkout.
2. API validates, creates the order with status `AWAITING_CONFIRMATION`, payment `UNPAID`, decrements stock.
3. API returns a `wa.me` URL with a prefilled message: order code, items with quantities, subtotal, shipping, total, delivery address.
4. Customer is redirected to WhatsApp and sent a confirmation page link.
5. Owner replies with bank details or a Paystack link, confirms payment, marks the order paid in the dashboard.

WhatsApp number is normalised to international format without the plus sign.

### Paystack

1. Customer submits checkout with Paystack selected.
2. API creates the order with status `PENDING_PAYMENT`, a 30 minute `expiresAt`, and initialises a transaction with the order code as the reference and the total in kobo.
3. Customer pays on Paystack and returns to `/order/:code`.
4. The page calls `/orders/:code/verify`. The webhook runs in parallel.
5. Both paths go through one idempotent function that confirms status, currency and amount, then marks the order `PAID` and `CONFIRMED`, and sends emails once.
6. A scheduled job cancels expired unpaid orders and restocks.

Requirements: verify the `x-paystack-signature` header with HMAC SHA512 over the raw body. Never trust the callback query string alone. If Paystack initialisation fails, cancel the order and restock before returning an error.

## 10. Shipping

- Nationwide delivery dispatched manually through courier partners, with courier name and tracking number recorded on the order.
- Fee is looked up by delivery state, falling back to the default fee.
- Optional free shipping above a configured subtotal.
- Seed all 36 states plus FCT with placeholder rates the owner edits before launch.
- Checkout and the product pages show estimated delivery days from the state rate.
- Delivery and returns policies are linked from checkout.

## 11. Design

Light-first design system with a dark mode toggle, mobile-first, built for a Nigerian audience on mid-range phones. The chosen direction is "Showcase" (see `design-lab/b-showcase.html` and `apps/web/app/tokens.css`).

- Light surfaces by default across the storefront and admin, with a dark theme set through `data-theme="dark"` and remembered per visitor. Strong contrast and visible keyboard focus in both.
- One accent colour (raspberry `#C21E5B` light, `#FF7BA9` dark) used for primary actions, prices and sale badges. Product tiles use four soft tone colours. Define all colours, spacing, radii and type sizes as tokens in the Tailwind config and use only tokens.
- One typeface family for UI: Bricolage Grotesque, with tabular numerals for prices. Egbeda store details live in the footer, not the hero.
- Product photography is the visual centre. Consistent square image ratio, generous image area, minimal chrome around it.
- Sticky bottom bar on mobile product pages with price and add to cart.
- Cart and checkout optimised for thumb use: large tap targets, numeric keyboard for phone, minimal fields.
- Respect `prefers-reduced-motion`. Entrance and scroll-reveal animation plays once with `motion`. No looping or auto-playing motion.
- Logo and brand assets are supplied by the owner. Use a wordmark placeholder until they arrive.

## 12. Non-functional requirements

- Performance: LCP under 2.5s on a throttled mobile profile. Images served from R2 through the CDN domain with long-lived cache headers, resized per device by `next/image`.
- Security: helmet, CORS limited to the web origin, rate limits on login, order creation and tracking, bcrypt password hashing (`bcryptjs`, cost 12), refresh tokens stored only as SHA-256 hashes, input validation on every endpoint, no secrets in the client bundle.
- Reliability: database backups enabled, order creation and stock changes inside a transaction, idempotent payment handling.
- Accessibility: semantic markup, labelled form controls, WCAG AA contrast.
- SEO: server-rendered catalog, sitemap generated from products and categories, JSON-LD `Product` markup, descriptive titles and meta.
- Compliance: privacy notice covering personal data collected at checkout, aligned with the Nigeria Data Protection Act.

## 13. Open items to confirm with the owner

- Store name styling, logo, brand colours, domain name
- WhatsApp number to use for orders (set in Admin, Settings, no redeploy needed)
- Product list, prices and photos to load for launch, ideally as a spreadsheet for CSV import
- Paystack business account and verification status
- Courier partners and real delivery rates per state
- Returns and warranty policy wording
- Whether she wants Instagram and TikTok links and a Meta Pixel at launch

## 14. Engineering conventions (copy into CLAUDE.md)

- TypeScript strict mode everywhere. No `any`.
- Do not write code comments.
- Prefer small, single-purpose modules. Business logic lives in NestJS services, controllers stay thin.
- Validate all input with DTOs on the API and zod on the web.
- Money is integer naira. Format only at the edge, in one shared helper.
- All writes that touch stock or order state run in a Prisma transaction.
- Server components by default on the web, client components only where interaction needs them.
- Use the shared types package for enums and DTO shapes. Never duplicate them.
- Each phase: write the code, run lint, typecheck and tests, then summarise what changed in a few lines before moving on.
- Tests: unit tests for pricing, shipping and payment verification logic. One end-to-end test per checkout path.
- Commit per logical unit with clear messages.

## 15. First instruction for Claude Code

```
Read PRD.md and CLAUDE.md. Execute Phase 0 only. Stop when its acceptance criteria are met and list what you built and what you need from me before Phase 1.
```
