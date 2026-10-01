# i3City

Read `PRD.md` for scope and `DESIGN.md` for the visual system. Work one phase at a time and do not start a phase until the previous one meets its acceptance criteria.

## Commands

- `pnpm dev` runs the web app (port 3000) and the API (port 4000).
- `pnpm turbo run lint check-types build` and `pnpm test` verify the repo. `pnpm --filter api test:e2e` needs a running Postgres.
- `pnpm db:up` starts local Postgres in Docker. Database commands run from `apps/api`: `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`.

## Code

- TypeScript strict mode everywhere. No `any`.
- Do not write code comments.
- Prefer small, single-purpose modules. Business logic lives in NestJS services, controllers stay thin.
- Validate all input with DTOs on the API and zod on the web.
- Read environment variables only through the zod-validated modules: `apps/api/src/config/env.ts` (injected with the `ENV` token) and `apps/web/lib/env.ts`. Never read `process.env` elsewhere. Add new variables to the schema and to `.env.example`.
- Money is integer naira. Format only at the edge, in one shared helper.
- All writes that touch stock or order state run in a Prisma transaction.
- Server components by default on the web, client components only where interaction needs them.
- Use `packages/types` for enums, DTO shapes, API types and `formatNaira`. Never duplicate them in an app.
- Use date-fns for all date formatting and arithmetic. The API uses `@date-fns/tz` for Lagos days.

## Styling

All styling must use the design tokens defined in `DESIGN.md` and `apps/web/app/tokens.css`. Never hard-code colours, font sizes, spacing, radii or font names in components. If a token is missing, add it to the tokens first and document it in `DESIGN.md`.

- UI is built from shadcn components (Base UI) in `apps/web/components/ui`. Reuse them before writing new markup, and follow the rules in `DESIGN.md` when adding or editing one.

## API and web

- Every API response uses the envelope from `@repo/types` (`ApiSuccess`, `ApiFailure`, `PaginationMeta`). Controllers return plain values or a `Paginated` result and throw Nest exceptions. Never build the envelope by hand.
- The web app makes all HTTP calls with axios through `apps/web/lib/api.ts` (`request`, `requestPage`, `requestVoid`) and handles failures as `ApiError`. Do not call `fetch` for the API.
- Admin routes use `JwtAuthGuard`. The web app signs in through NextAuth and sends the access token as a bearer token.

## Process

- Each phase: write the code, run lint, typecheck and tests, then summarise what changed in a few lines before moving on.
- Tests: unit tests for pricing, shipping and payment verification logic. One end-to-end test per checkout path.
- Commit per logical unit with a short conventional subject and no body.
