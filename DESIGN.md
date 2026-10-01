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

The tokens use shadcn's semantic names, so every shadcn component works without changes. Values live in `apps/web/app/tokens.css`: light on `:root`, dark on `:root[data-theme="dark"]`. Use them as Tailwind utilities: `bg-primary`, `text-muted-foreground`, `border-border`.

| Token                           | Light                                         | Dark                                       | Use                                                                     |
| ------------------------------- | --------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `background`                    | `#FFFFFF`                                     | `#150E19`                                  | Page background                                                         |
| `foreground`                    | `#1D1320`                                     | `#F7EEF3`                                  | Body text, headings, outline buttons                                    |
| `card`, `card-foreground`       | `#FFFFFF`, `#1D1320`                          | `#150E19`, `#F7EEF3`                       | Cards and panels, separated by `border`                                 |
| `popover`, `popover-foreground` | `#FFFFFF`, `#1D1320`                          | `#1F1525`, `#F7EEF3`                       | Menus, dialogs, tooltips                                                |
| `primary`                       | `#C21E5B`                                     | `#FF7BA9`                                  | The one accent: primary buttons, prices, sale badges, links, focus ring |
| `primary-foreground`            | `#FFFFFF`                                     | `#150E19`                                  | Text on `primary`                                                       |
| `secondary`, `muted`            | `#FAF5F8`                                     | `#1F1525`                                  | Inputs, footer, hover fills, delivery panel                             |
| `secondary-foreground`          | `#1D1320`                                     | `#F7EEF3`                                  | Text on `secondary`                                                     |
| `muted-foreground`              | `#675B6C`                                     | `#B9A9BF`                                  | Secondary text, categories, old prices                                  |
| `accent`, `accent-foreground`   | `#FBE6EF`, `#1D1320`                          | `#3A1B2B`, `#F7EEF3`                       | Soft highlight: hovered and selected rows, active nav item              |
| `destructive`                   | `#B42318`                                     | `#FF8D84`                                  | Delete and error states only                                            |
| `border`, `input`               | `#EBE1E8`                                     | `#33263A`                                  | Borders and dividers                                                    |
| `ring`                          | `#C21E5B`                                     | `#FF7BA9`                                  | Focus outline                                                           |
| `tone-1` to `tone-4`            | `#FBE9F0`, `#EEE9FB`, `#E3F0FA`, `#FFEEE0`    | `#2E1B30`, `#272040`, `#1B2A3A`, `#35241F` | Product tile backgrounds: pink, lilac, sky, peach                       |
| `success`                       | `#0B7A4B`                                     | `#5FD3A0`                                  | In stock, confirmed                                                     |
| `warning`                       | `#A5480A`                                     | `#F5B15A`                                  | Low stock                                                               |
| `sidebar*`                      | follow `muted`, `primary`, `accent`, `border` | same                                       | Admin sidebar                                                           |

Note that in shadcn's vocabulary `accent` is the soft highlight, and our brand accent colour is `primary`.

Contrast (WCAG): light foreground 18.0, muted-foreground 6.4 (5.9 on `muted`, 5.5 on `tone-1`), primary on background 5.8, primary-foreground on primary 5.8, warning 5.9, success 5.4. Dark foreground 16.7, muted-foreground 8.6, primary 7.8, warning and success 10.2. All pass AA for normal text.

Rules:

- Product tiles cycle through `tone-1` to `tone-4` by product position, so neighbours differ.
- Out-of-stock states use `muted-foreground`, never red. `destructive` is for delete actions and errors.
- Do not introduce a second accent. `success` and `warning` are for text and small badges only.

## Typography

One family: **Bricolage Grotesque** (Google Fonts, optical size axis, weights 300 to 800), loaded with `next/font` and exposed as `--font-bricolage`. Prices use tabular, lining numerals (`font-variant-numeric: tabular-nums lining-nums`) through one shared price class.

| Token        | Size                         | Weight     | Line height | Tracking | Use                              |
| ------------ | ---------------------------- | ---------- | ----------- | -------- | -------------------------------- |
| `text-h1`    | `clamp(2.3rem, 9vw, 4.6rem)` | 800        | 0.98        | -0.045em | Home hero only                   |
| `text-h2`    | `clamp(1.7rem, 6vw, 2.6rem)` | 800        | 1.0         | -0.04em  | Section headings                 |
| `text-h3`    | `1rem`                       | 700        | 1.25        | -0.015em | Product names                    |
| `text-price` | `1.1rem`                     | 800        | 1.2         | 0        | Card prices                      |
| `text-body`  | `1rem`                       | 400        | 1.55        | 0        | Paragraphs                       |
| `text-small` | `0.85rem`                    | 400 to 600 | 1.4         | 0        | Categories, captions, old prices |

Rules:

- Sentence case everywhere. No all-caps labels, no tracked-out eyebrows above headings.
- Keep paragraph lines under 70 characters.
- Do not bold or colour a single word inside a headline.
- Prices are always formatted by the shared naira helper (`₦148,000`), never by hand.

## Spacing

4px base. Use Tailwind's default scale, which matches.

| Step | Value | Typical use                                 |
| ---- | ----- | ------------------------------------------- |
| 1    | 4px   | Icon to label                               |
| 2    | 8px   | Tight stacks                                |
| 3    | 12px  | Gap between cards on mobile, in-card gaps   |
| 4    | 16px  | Mobile page gutter, card padding            |
| 6    | 24px  | Card gap on desktop, panel inner gaps       |
| 8    | 32px  | Desktop page gutter, hero padding on mobile |
| 10   | 40px  | Desktop row gap between product cards       |
| 14   | 56px  | Space between page sections                 |
| 16   | 64px  | Hero inner padding on desktop               |

Layout: content max width 1240px, centred, gutter 16px on mobile and 32px from 720px up. Product grid is 2 columns on mobile and 3 from 720px.

## Radii

| Token         | Value | Use                                                    |
| ------------- | ----- | ------------------------------------------------------ |
| `radius-sm`   | 10px  | Small chips, inputs inside panels                      |
| `radius-md`   | 20px  | Product tiles, bento tiles, stat boxes, floating chips |
| `radius-lg`   | 32px  | Hero panel, delivery panel, WhatsApp banner            |
| `radius-pill` | 999px | Buttons, search field, badges, quick-pick chips        |

## Components

- **Product tile.** Square, `radius-md`, tone background, product image at about two thirds of the tile, centred. Badge at top left. One tile ratio everywhere.
- **Product card.** Tile, then category in `text-small` muted, then name and price on one row, then a full-width pill button. Out of stock shows a disabled button reading "Out of stock".
- **Buttons.** Pill, minimum height 50px (44px inside cards). Primary uses `accent` with `on-accent` text. Secondary is a 2px `text` outline that fills on hover.
- **Badges.** Pill. Sale uses `accent`. Low stock and out of stock sit on `bg` with `warning` and `muted` text.
- **Header.** Centred wordmark, category links on the left, search, cart and theme toggle on the right. Search moves into its own row on mobile.
- **Footer.** Brand, shop links, help links, then the store address, opening hours and a WhatsApp button.
- **Wordmark.** Text placeholder "i3city" in `font-weight: 800`, with "city" in `accent`, until the owner supplies a logo.

## UI components

The admin and storefront use shadcn components built on Base UI, installed into `apps/web/components/ui`. They are ours to edit, and they follow the system above:

- Sizes: buttons and inputs are `h-11` (44px) by default, `h-12` for large, `h-9` for dense toolbars. Do not go below 36px except for compact table controls.
- Shape: buttons, inputs, selects, tabs and badges are pills. Textareas, cards, dialogs and popovers use `rounded-md` (20px). The radius scale maps shadcn's `xl` to 20px, `2xl` and `3xl` to 32px and `4xl` to a pill.
- Buttons: bold, `primary` filled for the main action, a 2px `foreground` outline for secondary, `destructive` only for deletes.
- Data tables use `components/ui/data-table.tsx` (TanStack Table v8). Pass `pagination` for server-side paging and `sorting` with `onSortingChange` for server-side sorting. Prices use the `price` class.
- Add components with `pnpm dlx shadcn@latest add <name> --cwd apps/web`, then adjust the result to match this document: import `cn` from `@/lib/utils`, use token utilities only, and apply the sizes and shapes above.
- Theming uses `next-themes` (`components/providers/theme-provider.tsx`), which sets a `data-theme` attribute on `<html>`. It defaults to light, ignores the OS setting and remembers the choice in `i3-theme`. Use its `useTheme` hook when a component needs the theme, and Tailwind's `dark:` variant for dark-only styling.

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
- Don't leave a freshly installed shadcn component as generated. Adapt its sizes, radii and colours first.
- Don't add a second accent colour or gradient washes.
- Don't use all-caps labels, numbered section markers, or middle-dot meta strings.
- Don't mention the Egbeda store in heroes or headlines. It belongs in the footer and contact areas.
- Don't use red for out-of-stock. Use `muted`.
- Don't use auto-playing or scroll-triggered animation.
- Don't switch to dark mode automatically from the OS setting on first visit.
- Don't vary the product image ratio. It is always square.
