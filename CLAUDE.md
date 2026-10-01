# i3City

Read `PRD.md` for scope and `DESIGN.md` for the visual system.

## Styling

All styling must use the design tokens defined in `DESIGN.md` and `apps/web/app/tokens.css`. Never hard-code colours, font sizes, spacing, radii or font names in components. If a token is missing, add it to the tokens first and document it in `DESIGN.md`.

## Code

Do not write code comments.

## API and web conventions

- Every API response uses the envelope from `@repo/types` (`ApiSuccess`, `ApiFailure`, `PaginationMeta`). Controllers return plain values or a `Paginated` result and throw Nest exceptions. Never build the envelope by hand.
- The web app makes all HTTP calls with axios through `apps/web/lib/api.ts` (`request`, `requestPage`, `requestVoid`) and handles failures as `ApiError`. Do not call `fetch` for the API.
- Shared enums, DTO shapes and API types live in `packages/types`. Never duplicate them in an app.
