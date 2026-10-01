# i3City Design System

Direction: **Showcase**. Light first, with a dark theme. Soft pastel product tiles, a raspberry accent, large confident headlines, pill-shaped actions. Reference page: `design-lab/b-showcase.html`. Token source: `apps/web/app/tokens.css`, imported by the web app's global CSS.

Every colour, size, space and radius below is a token. Components use tokens only, never raw values.

## Principles

1. Product images are the visual centre. Everything else is quiet around them.
2. One accent colour, used for actions, prices and sale badges only.
3. Light by default. Dark is a toggle, stored per visitor, and never follows the OS on first visit.
4. Mobile first. Every tap target is at least 44px.
5. Plain, specific copy in sentence case. Buttons name what happens: "Add to cart", "Chat on WhatsApp".
6. The store address and hours live in the footer, not in the hero or headlines.

## Colour tokens

Set on `:root`, overridden on `:root[data-theme="dark"]`. Exposed to Tailwind as `bg-bg`, `text-muted`, `border-line` and so on.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#FFFFFF` | `#150E19` | Page background |
| `surface` | `#FAF5F8` | `#1F1525` | Inputs, footer, delivery panel |
| `text` | `#1D1320` | `#F7EEF3` | Body and headings |
| `muted` | `#675B6C` | `#B9A9BF` | Secondary text, categories, old prices |
| `line` | `#EBE1E8` | `#33263A` | Borders and dividers |
| `accent` | `#C21E5B` | `#FF7BA9` | Primary buttons, prices, sale badges, links |
| `on-accent` | `#FFFFFF` | `#150E19` | Text on accent |
| `accent-soft` | `#FBE6EF` | `#3A1B2B` | Accent tints, focus halo |
| `tone-1` | `#FBE9F0` | `#2E1B30` | Product tile, pink |
| `tone-2` | `#EEE9FB` | `#272040` | Product tile, lilac |
| `tone-3` | `#E3F0FA` | `#1B2A3A` | Product tile, sky |
| `tone-4` | `#FFEEE0` | `#35241F` | Product tile, peach |
| `success` | `#0B7A4B` | `#5FD3A0` | In stock, confirmed |
| `warning` | `#A5480A` | `#F5B15A` | Low stock |

Contrast (WCAG): light text 18.0, muted 6.4 (5.9 on surface, 5.5 on tone-1), accent on bg 5.8, on-accent 5.8, warning 5.9, success 5.4. Dark text 16.7, muted 8.6, accent 7.8, warning and success 10.2. All pass AA for normal text.

Rules:
- Product tiles cycle through `tone-1` to `tone-4` by product position, so neighbours differ.
- Out-of-stock states use `muted`, never red.
- Do not introduce a second accent. Status colours (`success`, `warning`) are for text and small badges only.

## Typography

One family: **Bricolage Grotesque** (Google Fonts, optical size axis, weights 300 to 800), loaded with `next/font` and exposed as `--font-bricolage`. Prices use tabular, lining numerals (`font-variant-numeric: tabular-nums lining-nums`) through one shared price class.

| Token | Size | Weight | Line height | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `text-h1` | `clamp(2.3rem, 9vw, 4.6rem)` | 800 | 0.98 | -0.045em | Home hero only |
| `text-h2` | `clamp(1.7rem, 6vw, 2.6rem)` | 800 | 1.0 | -0.04em | Section headings |
| `text-h3` | `1rem` | 700 | 1.25 | -0.015em | Product names |
| `text-price` | `1.1rem` | 800 | 1.2 | 0 | Card prices |
| `text-body` | `1rem` | 400 | 1.55 | 0 | Paragraphs |
| `text-small` | `0.85rem` | 400 to 600 | 1.4 | 0 | Categories, captions, old prices |

Rules:
- Sentence case everywhere. No all-caps labels, no tracked-out eyebrows above headings.
- Keep paragraph lines under 70 characters.
- Do not bold or colour a single word inside a headline.
- Prices are always formatted by the shared naira helper (`₦148,000`), never by hand.

## Spacing

4px base. Use Tailwind's default scale, which matches.

| Step | Value | Typical use |
| --- | --- | --- |
| 1 | 4px | Icon to label |
| 2 | 8px | Tight stacks |
| 3 | 12px | Gap between cards on mobile, in-card gaps |
| 4 | 16px | Mobile page gutter, card padding |
| 6 | 24px | Card gap on desktop, panel inner gaps |
| 8 | 32px | Desktop page gutter, hero padding on mobile |
| 10 | 40px | Desktop row gap between product cards |
| 14 | 56px | Space between page sections |
| 16 | 64px | Hero inner padding on desktop |

Layout: content max width 1240px, centred, gutter 16px on mobile and 32px from 720px up. Product grid is 2 columns on mobile and 3 from 720px.

## Radii

| Token | Value | Use |
| --- | --- | --- |
| `radius-sm` | 10px | Small chips, inputs inside panels |
| `radius-md` | 20px | Product tiles, bento tiles, stat boxes, floating chips |
| `radius-lg` | 32px | Hero panel, delivery panel, WhatsApp banner |
| `radius-pill` | 999px | Buttons, search field, badges, quick-pick chips |

## Components

- **Product tile.** Square, `radius-md`, tone background, product image at about two thirds of the tile, centred. Badge at top left. One tile ratio everywhere.
- **Product card.** Tile, then category in `text-small` muted, then name and price on one row, then a full-width pill button. Out of stock shows a disabled button reading "Out of stock".
- **Buttons.** Pill, minimum height 50px (44px inside cards). Primary uses `accent` with `on-accent` text. Secondary is a 2px `text` outline that fills on hover.
- **Badges.** Pill. Sale uses `accent`. Low stock and out of stock sit on `bg` with `warning` and `muted` text.
- **Header.** Centred wordmark, category links on the left, search, cart and theme toggle on the right. Search moves into its own row on mobile.
- **Footer.** Brand, shop links, help links, then the store address, opening hours and a WhatsApp button.
- **Wordmark.** Text placeholder "i3city" in `font-weight: 800`, with "city" in `accent`, until the owner supplies a logo.

## Motion

- Motion only responds to a user action: hover, focus, press, opening a panel.
- Product image: scale to 1.05 and rotate -2deg on hover, 300ms. Bento tile: lift 3px, 200ms.
- Honour `prefers-reduced-motion` by turning all transitions off.
- No auto-playing carousels, entrance animations or looping effects.

## Accessibility

- Visible focus on every interactive element: 3px `accent` outline, 3px offset.
- Minimum tap target 44px.
- Both themes meet AA contrast (see above).
- Images have meaningful alt text. Decorative device art is hidden from assistive tech.

## Do

- Use tokens for every colour, size, space and radius.
- Let product photography carry the page. Keep chrome light.
- Show the saving in naira on sale items ("Save ₦17,000").
- Keep copy specific: states, days, prices, stock counts.
- Check any new colour pairing for AA contrast in both themes before using it.

## Don't

- Don't hard-code hex values, pixel sizes or font names in components.
- Don't add a second accent colour or gradient washes.
- Don't use all-caps labels, numbered section markers, or middle-dot meta strings.
- Don't mention the Egbeda store in heroes or headlines. It belongs in the footer and contact areas.
- Don't use red for out-of-stock. Use `muted`.
- Don't use auto-playing or scroll-triggered animation.
- Don't switch to dark mode automatically from the OS setting on first visit.
- Don't vary the product image ratio. It is always square.
