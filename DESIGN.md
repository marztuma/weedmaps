---
name: Weedmaps — The Shelf
description: A printed-paper cannabis delivery marketplace where the product, its price and the service that brings it are all on one ticket.
colors:
  linen: "#f9f5f2"
  linen-deep: "#f2ece7"
  paper: "#ffffff"
  ink: "#141314"
  ink-soft: "#3c3a40"
  shade: "#5f5c66"
  mute: "#656170"
  fade: "#a09da6"
  rule: "#d6d5d9"
  rule-soft: "#e6e2e0"
  orange: "#f15a26"
  orange-text: "#b8431a"
  orange-tint: "#f9c5b3"
  ember: "#3a1408"
  purple: "#7755a3"
  purple-tint: "#ddd2ea"
  green: "#419b45"
  green-text: "#2f7a34"
  green-tint: "#cfe4d0"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.05rem, 6.2vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  display-page:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5.4vw, 4rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  display-thin:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 7vw, 5rem)"
    fontWeight: 200
    lineHeight: 0.92
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline-section:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.55rem, 3.1vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  index:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  stat:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, monospace"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "normal"
    fontFeature: "tnum 1, zero 1"
  panel:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  subhead:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  spec:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontFeature: "tnum 1, zero 1"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-small:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  control:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  caption:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.09em"
  meta:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.09em"
    fontFeature: "tnum 1, zero 1"
  data:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, monospace"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "normal"
    fontFeature: "tnum 1, zero 1"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  pill: "50px"
spacing:
  gutter: "clamp(1rem, 0.55rem + 2.25vw, 2.5rem)"
  rail-gap: "1rem"
  page-head: "clamp(1.5rem, 3vw, 2.5rem)"
  section-tight: "clamp(2.25rem, 4vw, 3.25rem)"
  section: "clamp(2.5rem, 5vw, 4rem)"
  section-loose: "clamp(3rem, 6vw, 5rem)"
  shell: "1250px"
components:
  pill-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
    typography: "{typography.body}"
  pill-solid-hover:
    backgroundColor: "{colors.ink-soft}"
    textColor: "{colors.linen}"
  pill-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
    typography: "{typography.control}"
  pill-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
  pill-segment-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  pill-segment-rest:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
  pill-toggle-on:
    backgroundColor: "{colors.green-tint}"
    textColor: "#1f4a21"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  pill-toggle-off:
    backgroundColor: "transparent"
    textColor: "{colors.shade}"
  filter-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    typography: "{typography.caption}"
  filter-chip-rest:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    typography: "{typography.caption}"
  quick-add:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    width: "100%"
    typography: "{typography.caption}"
  quick-add-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
  add-to-cart:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
    typography: "{typography.body}"
  add-to-cart-disabled:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.mute}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "44px"
  icon-button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
  status-chip-live:
    backgroundColor: "{colors.green-tint}"
    textColor: "#1f4a21"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    typography: "{typography.meta}"
  status-chip-paused:
    backgroundColor: "{colors.rule-soft}"
    textColor: "{colors.shade}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    typography: "{typography.meta}"
  deal-chip:
    backgroundColor: "{colors.orange-tint}"
    textColor: "#8f3312"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
    typography: "{typography.meta}"
  shortfall-note:
    backgroundColor: "{colors.orange-tint}"
    textColor: "#8f3312"
    rounded: "{rounded.xs}"
    padding: "8px 12px"
    typography: "{typography.meta}"
  product-label:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "9%"
    width: "clamp(158px, 42vw, 212px)"
  product-label-hero:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "9%"
    width: "420px"
---

# Design System: Weedmaps — The Shelf

<!-- Recorded after the build, from app/globals.css, app/**/page.jsx, components/*.jsx and
     the validated captures in .impeccable/review/. No approved comp exists for any region
     of this site: the build was code-led, and the code is the authority here. This pass
     re-records the type ramp against verified counts across app/ and components/ and adds
     the ten-route surface set, the shared page shell and the cart. The world itself did not
     move. -->

## Overview

**Creative North Star: "The Printed Shelf Ticket"**

This is a paper world. The ground is linen (`#f9f5f2`) under a real, visible tooth, ruled by hairlines rather than boxed by cards, and set in Manrope pulled to its two extremes — 200 and 800 — at a hard −0.04em. Everything commercial is printed onto it like a shop ticket: the price in tabular mono, the service that brings it and how soon it arrives directly beneath, the strain seal stamped in a circle. There is no product photography anywhere in the build, and none is coming; each product renders as an authored package label instead. That is the signature and the constraint at once.

The palette and type were extracted from a reference the user pinned by name (ryeisland.com), read out of that site's own stylesheets rather than guessed at. The user explicitly rejected Weedmaps' own visual design; only the name and the information architecture carry across. The world's loudest move is the drenched band — a whole section flooded in orange, purple or ink, edge to edge, carrying its type in the opposite value rather than in a tinted panel.

The site is no longer one page: ten routes ship, and `app/layout.jsx` is the shell that makes them one place — it owns the header, the sticky delivery bar, the footer, the age gate and the cart drawer, and reads the delivery services itself so the bar is true on every route. Interior pages introduce no new visual language. They compose the same parts: a page header over a breadcrumb, a filter bar that writes to the URL, a grid of the same product card the shelves use, and the same hairline index rows. Density is high and legible: long rules, tight leading, small mono meta, one gesture of motion.

**Key Characteristics:**
- Linen paper ground with a genuinely visible tooth, not a flat fill
- Manrope 200/800 at −0.04em; nothing lives in the middle weights at display size
- Hairline rules and index rows instead of cards and shadows
- Whole-section drenched color bands (orange, purple, ink) carrying inverse-value type
- Mono reserved strictly for measurable figures
- A closed type ramp of named steps, each carrying one role
- Products drawn as printed package labels; never stock photography
- One product card, shared by every shelf and every grid on every route
- One authored motion gesture, honored down to `prefers-reduced-motion`

## Colors

A warm paper neutral carrying three saturated inks — orange, purple, green — each of which is a band color first and a text color only under measured conditions.

### Primary
- **Signal Orange** (`{colors.orange}`): The brand's shout. It floods the deals band edge to edge, sets the counted figures in the masthead headline, and tints selection, the caret and the shelf underlines. It measures ~3.1:1 on linen — large text and UI only.
- **Kiln Orange** (`{colors.orange-text}`): The darkened stand-in (5.0:1 on linen) used wherever an orange word is small: discount percentages, the delivery-truck mark in the address bar, category hover.
- **Orange Wash** (`{colors.orange-tint}`): The ground of the deal chip and of the cart's order-minimum shortfall note.
- **Ember** (`{colors.ember}`): Secondary text on the orange band and nowhere else, at 4.85:1 against Signal Orange. It exists because opacity fades on that ground fail. The deals page's counted stat strip is the second surface to use it.

### Secondary
- **Dusk Purple** (`{colors.purple}`): The only text-safe accent on linen at 5.4:1. Also the app-CTA band ground and the focus-ring color.
- **Purple Bloom** (`{colors.purple-tint}`): Secondary copy and icons on the purple band.

### Tertiary
- **Licence Green** (`{colors.green}`): The live state — delivering now, licensed, lab-tested. ~3.2:1 on linen — large text and UI only.
- **Sage Green** (`{colors.green-text}`): The small-text green — the delivering-now dot and border, the shield and lab glyphs, the soonest-ETA clock.
- **Green Wash** (`{colors.green-tint}`): The ground of the live chip and of the Delivering-now filter when it is on.

### Neutral
- **Linen** (`{colors.linen}`): Page ground, and the reverse-out text color on the ink and purple bands. Also the cart drawer's own ground.
- **Deep Linen** (`{colors.linen-deep}`): The alternate band — category index, third shelf, footer — and the hover fill under bare icon controls.
- **Ink** (`{colors.ink}`): Body text at 16.7:1, the ink band ground, every solid control, and the cart drawer's left edge.
- **Ink Soft** (`{colors.ink-soft}`): Navigation, footer links, resting sort segments and resting filter chips.
- **Shade** (`{colors.shade}`): Secondary body copy, 6.0:1 on linen.
- **Mute** (`{colors.mute}`): The smallest labels. This exact value exists because `#777380` failed 4.5:1 on linen-deep; `#656170` clears it at 4.6:1.
- **Fade** (`{colors.fade}`): Non-semantic marks only — separator dots, disabled arrows, disabled steppers, paused dots, scrollbar thumb.
- **Rule / Rule Soft** (`{colors.rule}` / `{colors.rule-soft}`): The hairlines that carry the whole layout, and their lighter interior variant. `rule` is also the ground of a disabled add-to-bag button.

### Named Rules

**The Measured Ratio Rule.** Every pairing in this system carries a measured contrast ratio, not a nominal one. Orange and green sit near 3:1 on linen: permitted for large text and UI shape only, and small text must switch to `orange-text` / `green-text`. Purple is the one accent that may set small text on linen. If you introduce a pair, measure it before you ship it.

**The Drenched Band Rule.** A band takes the full section, edge to edge, and its type is ink — not white. Ink on orange is 5.4:1 and ink on green is 5.2:1; white on either fails. The ink and purple bands are the inverse case and take linen. There is no third option and no tinted-panel halfway house.

**The No-Opacity-On-Color Rule.** Text on a colored ground never gets its contrast from opacity. On orange, secondary text is `ember`; on purple, `purple-tint`. The ProductLabel colorway table carries a measured ratio for every foreground and every dim value, and a render-time opacity applied over that strip silently voids all of them at once. That bug shipped once already.

## Typography

**Display Font:** Manrope (with ui-sans-serif, system-ui fallback)
**Body Font:** Manrope
**Label/Mono Font:** Geist Mono (with ui-monospace, "SF Mono" fallback)

**Character:** One sans family worked at both ends of its range — a 200 weight that reads like a printed headline and an 800 that reads like a price board — with a monospace face admitted only where a figure is being measured. Tracking is pulled tight at display sizes (−0.04em) and pushed wide at label sizes (+0.09em); the gap between those two settings is most of the system's texture.

The ramp is discrete and closed. Below the fluid display steps it is a list of fixed rem values, each carrying exactly one role and each used enough times to be a system rather than a preference. The counts below are the shipped counts across `app/` and `components/`; no size in the ramp has fewer than three uses, and no size outside it ships.

### Hierarchy

**Fluid steps (clamped, display and headline)**
- **Display** (800, `clamp(2.05rem, 6.2vw, 4.75rem)`, 0.92, balanced wrap): The masthead statement over a 20ch measure — retuned from `clamp(2.1rem, 7.4vw, 5.5rem)`/16ch because the delivery headline runs three lines and the first price has to stay above the fold. The age gate takes the same role at `clamp(1.9rem, 5vw, 2.5rem)`, and the product detail h1 at `clamp(2rem, 5vw, 3.5rem)` over 16ch.
- **Display Page** (800, `clamp(2rem, 5.4vw, 4rem)`, 0.92): The h1 of every interior route, set by `PageHeader` over an 18ch measure, and reused verbatim by the brand and delivery detail pages. This is what makes ten routes read as one site.
- **Display Thin** (200, `clamp(2.4rem, 7vw, 5rem)`, 0.92): The band headlines — deals (`7vw`/5rem) and app CTA (`6.5vw`/4.5rem). The thin cut is what makes a flooded section read as printing rather than as a banner.
- **Headline** (800, `clamp(1.75rem, 3.2vw, 2.6rem)`, 1.02): Top-level section titles — the delivery-service list, brands, learn.
- **Headline Section** (800, `clamp(1.55rem, 3.1vw, 2.6rem)`, 1.02): The shelf name and the in-page section titles on the product, delivery and products routes. One step down from Headline and used where a section sits inside a page that already has an h1.

**Fixed steps (the discrete ramp, largest to smallest)**
- **Index** (800, 2rem, 1.02): Three uses. The mobile nav links, the A–Z letter marker on the brands page, and the hero price on the product detail page. The one step that is a piece of navigation furniture rather than a heading.
- **Stat** (mono, 600, 1.5rem, tabular): Four uses. Counted figures standing alone: the three deals-page counters on the orange strip and the cart's grand total.
- **Panel** (800, 1.35rem, 1.02): Seven uses. The wordmark in header, footer and mobile sheet, and the heading of a panel or an empty state — the cart drawer's title, the empty grid, the empty service list.
- **Subhead** (700, 1.15rem, −0.025em): Six uses. The rank above a title: service names in the delivery list, the group heads on the delivery detail page, the related-product name on product detail, and the price on a deals-band ticket.
- **Title** (700, 1.05rem, −0.025em): Nine uses. Row and card names — categories, brands in the ribbon and the A–Z list, article titles, the how-it-works steps, and the search field's own input text.
- **Spec** (mono, 1rem, tabular): Six uses. The `dd` figure of a definition pair on the product and delivery pages, the app-feature titles, the quantity in the stepper, and the service name heading a cart group. The measured value in a labelled pair, never running copy.
- **Body** (400, 0.95rem, 1.6): Eighteen uses. Standing copy, primary control text, product names in a card or cart line. Capped at 68ch by `.u-prose`.
- **Body Small** (400, 0.9rem, 1.6): Seventeen uses. Copy that sits inside chrome rather than in a column: nav links, subtitles under a section heading, the descriptive line on an index or an empty state.
- **Control** (700, 0.85rem, −0.01em): Eleven uses. Every pill and button label — outlined pills, the search submit, the back link, the sort segments, the Delivering-now filter, a cart checkout button.
- **Caption** (600, 0.8rem): Fifteen uses. Fine print and dense secondary controls: struck former prices, counts, legal lines, filter chips and the quick-add button.
- **Label** (600, 0.6875rem, +0.09em, uppercase): Non-measurement small caps — footer column heads, "Sort", "Change", the store-button superscript.
- **Meta** (mono, 0.6875rem, +0.09em, uppercase, tabular): Measured small caps — arrival windows and ETAs, fees, order minimums, item counts, weights, potency, read time, breadcrumbs.
- **Data** (mono, semibold, tabular with slashed zero): The family role for prices, ratings and counts at any size. `data` is a face, not a size: it composes with Stat, Subhead, Spec, Body or Caption depending on what the figure is doing.

### Named Rules

**The Named Step Rule.** Every type size in this system is one of the named steps above, and every step carries one role. A new size is allowed only if it earns a name, a role and at least three uses; otherwise it is a singleton and gets snapped to the nearest step — the way a 1.1rem service heading went to Subhead and a 1.25rem deals price went to Subhead. Adjacent steps are not redundant: 0.8 is fine print, 0.85 is a control label, 0.9 is copy inside chrome, and the three are never interchanged because they look close.

**The Ruler Rule.** Mono is for things you could put a ruler to: prices, weights, potency, ETAs and arrival windows, fees, minimums, counts, ratings, review totals. Everything else at the same small-caps rhythm uses `label`, which is the sans at identical size and tracking. Mono is never a costume for "technical". This boundary erodes silently — check every new uppercase micro-label against it.

**The Two-Extremes Rule.** Display type is 800 or 200. Nothing at display size sits in between; the middle weights belong to titles and body.

**The Tabular Figures Rule.** Every number that can be compared down a column carries `tabular-nums` and a slashed zero. Prices in a shelf must align, and so must ETAs down a service list.

## Layout

A single centered shell (`{spacing.shell}` max) with a fluid gutter (`{spacing.gutter}`) scaling from 16px to 40px, applied by the `.u-shell` utility. There is no column grid in the classical sense: a page is a stack of full-bleed sections, each of which either constrains to the shell or deliberately breaks it.

**The shell is the site.** `app/layout.jsx` wraps every route in the same furniture, in the same order: age gate, cart drawer, skip link, header, sticky delivery bar, `main`, footer. The delivery bar reads the service list at the layout level, so the address, the Delivering-now filter and the sort are true on `/deals` and `/brand/[slug]` exactly as they are on the homepage. A route supplies content, never chrome.

**The interior page grammar.** Ten routes ship — `/`, `/products`, `/products/[category]`, `/product/[slug]`, `/deliveries`, `/delivery/[slug]`, `/brands`, `/brand/[slug]`, `/deals`, `/search` — and every interior one opens the same way: a breadcrumb in mono meta, a Display Page h1 over an 18ch measure, an optional Spec-sized blurb, and optional right-aligned meta or a single action that drops below the title under `md`. Page head padding is `{spacing.page-head}` over `clamp(1.25rem, 2.4vw, 2rem)`; section bodies take `{spacing.section}`.

Vertical rhythm runs on three clamped section steps — tight, standard and loose — chosen per section weight rather than per nesting depth. Horizontal rhythm is set by the rail gap (1rem) and the hairline row.

The three structural moves:

- **The bleeding rail.** Product shelves are `overflow-x: auto` lists with x-proximity snap, padded to the shell's left edge but never to its right, so the last card is always cut by the viewport. Scroll is real (touch, trackpad, keyboard); desktop adds two 44px arrow buttons above the rail that disable at the ends rather than wrapping silently. The rail's own scrollbar is hidden; the page's is themed.
- **The product grid.** Where a route shows a whole catalogue rather than a curated shelf, the same card lands in a 2-up grid rising to 3 at `sm`, 4 at `lg` and 5 at `xl`, on a 1rem column gap and a 2.25rem row gap. The rail and the grid are the only two arrangements of products in the system, and they render the identical card.
- **The index row.** Categories, delivery services, brands and articles are `border-top` hairline rows in a 1/2/3-column responsive grid, not tiles. Each row is a full-width anchor with its metadata inline.

The address bar is `position: sticky; top: 0` at z-30, on `linen/95` with a small backdrop blur and a bottom hairline. It is the one persistently pinned element, because nothing on the site is true until the delivery address is set. On phones the address takes its own row above the filter and sort pair; from `sm` up they share a wrapped row, and the counted readout appears right-aligned at `md`.

Breakpoints are Tailwind defaults as used: `sm` 640 (controls collapse onto one wrapped line, three-up grid), `md` 768 (rail arrows, count readout, page-header meta moves to the right edge), `lg` 1024 (desktop nav replaces the sheet menu, three-column indexes, four-up grid), `xl` 1280 (rail aligns to the shell, five-up grid).

## Elevation & Depth

**This system has no shadows.** Not one `box-shadow` ships. Depth is entirely material and tonal: the paper tooth, the hairline rule, and the change of ground color between bands.

The tooth is a real material, not a token — an SVG fractal-noise tile (200px, baseFrequency 0.8, four octaves, desaturated, `opacity 0.14` in the tile under `0.9` element opacity) applied twice: `body::before` fixed over the linen ground, and the `.u-tooth` utility on every linen-deep band, same tile and same amplitude, so the two papers read as one stock. Sampling the shipped raster shows an 8–10 level spread across the ground: visible grain, not a rumor. An earlier version shipped it at roughly 2.75% and that counted as a broken promise at review.

The ink, orange and purple bands are deliberately untoothed — the grain belongs to the paper, and those bands are ink laid onto it. Product labels carry their own finer tooth (120px tile, `mix-blend-overlay` at 0.13) because they are printed objects, not the page.

Overlays separate by ground, blur and edge, never by a drop shadow: the age gate and the mobile menu sheet sit over `bg-ink/70` with `backdrop-blur-md`, and the cart drawer sits over `bg-ink/60` with `backdrop-blur-sm`, held off the page by a 1px ink border on its leading edge rather than by a shadow.

### Named Rules

**The Flat Paper Rule.** No shadows, ever. If an element needs to separate, change its ground, rule it with a hairline, or give it the tooth. A shadow in this world is a foreign object. A panel that floats over the page is bounded by a 1px ink border and a blurred ink scrim, and that is the whole vocabulary for floating.

**The Visible Grain Rule.** If the tooth cannot be seen at 100% on a normal display, it is not shipping. Grain you have to be told about is a broken promise, not a subtlety.

## Shapes

A low-radius world with one exaggerated exception. Rectangles are barely softened — 4px on focus rings and the cart's shortfall note, 6px on product labels and rail tiles, 10px on the age-gate dialog and the app feature stack. Anything that is a control is a full 50px pill: buttons, filter chips, the sort segments and their enclosing track, the Delivering-now toggle, the quantity stepper's outer track, status chips, deal chips.

Circles do the rest of the work. Every icon-only control is a circle, as are the strain seal on the product label, the discount badge in the deals band, the 56px empty-state marks in the cart and the empty grid, and the 32px logo mark. The result is a page of straight hairlines punctuated by round stamps.

Borders are 1px and are the primary structural device: `rule` for section and row separation, `rule-soft` for interior divisions, `ink` for outlined controls, the sort track, the quantity stepper and the leading edge of the cart drawer, `green-text` for the active Delivering-now toggle, `linen/25` for outlined controls on the ink band, `ink/25` on the orange band. The one dashed border in the build is the "browse all" terminator tile at the end of every shelf.

The product label is a fixed 4:5 portrait with a die-cut rule inset 7px from its own edge at 28% opacity — the printed trim mark that makes it read as a package face.

## Components

### Buttons
- **Shape:** Full pill (`{rounded.pill}`), 44px minimum height on every control, 48px for primary calls and add-to-bag, 56px for the store buttons.
- **Primary (solid):** Ink ground, linen text (`pill-solid`); hover goes `ink-soft`. On the drenched orange band the primary inverts instead, moving from linen-on-ink to ink-on-linen.
- **Secondary (outlined):** 1px ink border on transparent with ink text, filling to ink-on-linen on hover. On the ink band the same control is drawn in `linen/25` and fills to linen.
- **Disabled:** A `rule` ground with `mute` text and `cursor-not-allowed` — the shape stays, the contrast drops, nothing is hidden. Used when a service is not delivering.
- **Hover / Focus:** Color transitions only, 200ms on `--ease-std`. `:active` drops the control 1px. Focus is the global 2px purple ring at 3px offset with a 4px radius. No lift, no glow, no shadow.
- **Icon buttons:** 44px circle, transparent at rest; hover fills the circle (`icon-button-hover`) or tints to `linen-deep` in the header, the cart and the quantity stepper. Disabled rail arrows take a `rule-soft` border with a `fade` glyph and lose their hover entirely.

### Chips
- **Style:** Pill, `2px 8px` for status, `0 14px` for filters, tinted ground with a darkened text pair — never a bare accent on a bare ground.
- **Status state:** A live service uses green-wash with a `green-text` dot and reads "Delivering"; a stopped one uses rule-soft with a fade dot and reads "Paused"; a deal uses orange-tint. There is no third state, and no chip carries an hours string.
- **Filter state:** Selected is a solid ink pill with linen text; unselected is a `rule` hairline with `ink-soft` text going ink on hover. A filter chip carries its result count in mono beside its name, and a subcategory with no products is not rendered at all.

### Filter and Sort Controls (signature)
Two tiers, one vocabulary.

- **The delivery bar** (site-wide, in the shell) carries the `role="switch"` Delivering-now pill — bordered `rule` with `shade` text and a fade dot when off, filled green-wash with a green border, dark-green text and a green dot when on, shipping on by default — and the two-segment `role="radiogroup"` Fastest / Top-rated track: a single ink-outlined 50px track with 3px inner padding, the active segment a solid ink pill with linen text.
- **The catalogue filter bar** (`FilterBar`, on the products and category routes) sits between two hairlines and holds a row of subcategory chips with counts and a row of four sorts (Price ↑, Price ↓, Potency, Fastest). Every one of them writes to the query string via `router.push`, holding nothing in component state that the URL cannot reconstruct, so a filtered view is a shareable address and the back button behaves.

Both tiers are wired, not decorative: they move real content. Any replacement control must move real content the same way.

### Cards / Containers
There are almost no cards. The real containers:
- **Age-gate dialog:** 440px max, 10px radius, linen ground with a 1px ink border, 32–40px padding, over `bg-ink/70` and a blur.
- **Cart drawer:** a full-height right-hand panel to 460px, square, linen ground, 1px ink left border, over `bg-ink/60` and a blur. Header and footer are hairline-bounded and fixed; the line list scrolls between them.
- **App feature stack:** a 1px-gap grid on a `linen/25` ground clipped to a 10px radius, so the gaps read as ruled seams between purple panels.

Everything else that would be a card elsewhere is an index row: hairline top border, full-width anchor, 20px block padding, hover expressed as an orange-tinted underline on the title plus a filling arrow circle.

### Inputs / Fields
- **Style:** Not a box. Both fields in the system are transparent inputs on a hairline underline. The delivery-address field is semibold ink at Body size with a `mute` placeholder and a `orange-text` truck mark; the search field is semibold ink at Title size behind a 20px `mute` search glyph, with a solid ink submit pill beside it.
- **Focus:** The underline goes orange on focus (`focus-within` for the search label, `:focus` for the address) and `rule` on group hover; the global purple focus ring also applies. There is no filled state, no rounded search box, and no magnifying-glass-in-a-pill.

### Navigation
The header is a 68px bar on linen with a bottom hairline, holding the mark, the desktop nav, and a control cluster. Nav links are Body Small medium `ink-soft` with an orange 1px underline that grows from left to full width on hover (300ms). Below `lg` the nav collapses into a full-screen linen sheet: the same 68px bar, the search field, then rows of Index-step links divided by `rule-soft` hairlines, each with an arrow glyph, closing on a solid ink pill.

Descending nav is a breadcrumb in mono meta with `/` separators in `rule`, the current page in ink and its ancestors in `mute` with an orange-tinted underline on hover. A single ancestor gets a `BackLink` instead — a 44px outlined pill with a left chevron.

### Icons
One single-stroke grammar throughout: 24-unit box, `fill="none"`, `stroke="currentColor"`, 1.4 stroke width, round caps and joins, sized 12–24px at the call site. Thirty-odd glyphs, including the category set, and — new with the cart — plus, minus and trash. There is no icon font and no second stroke weight. Never a glyph character or an emoji standing in for a mark.

### The Product Label (signature)
The system's defining component and the reason no photography is needed. A 4:5 portrait in one of five committed colorways (ink, orange, purple, green, linen), each a measured foreground/dim pair. Composition, top to bottom: the brand line in mono meta; a category glyph; the strain name in display 800 filling the middle; a decorative bar-set; the strain type and weight in mono; a 44px circular seal stamped I/S/H; and a hairline-ruled batch strip carrying THC and CBD percentages. It carries its own printed tooth and the inset die-cut rule.

Two sizes ship. The default fills its rail tile or grid cell with the name at `clamp(1.15rem, 1.4vw + 0.85rem, 1.6rem)`. `size="hero"` raises the name to `clamp(1.6rem, 3.4vw, 2.75rem)` for the 420px label on the product detail page, where the card-scale setting read under-set at that width. Nothing else about the label changes between sizes: same colorways, same tooth, same die-cut.

### The Product Card (signature)
One card, everywhere. `ProductCard` is the label plus the ticket plus an optional quick-add, and it is what both a shelf rail and a catalogue grid render — extracted out of `Shelf` precisely so the two arrangements could never drift apart. The ticket shows the current price in mono `data`, the struck former price in Caption `mute`, the discount in `orange-text` meta, then — under a truck glyph — the service name and its delivery ETA. That ETA line is where a distance used to sit; the ticket answers "who brings it and how soon", never "how far away is it". Hover lifts the label 6px over 500ms on the expo ease — the only transform in the component set, and it lives on the label, not the card. Beneath the ticket sits the quick-add: a full-width outlined Caption pill that fills to ink on hover, flips to a check and "Added" for 1.5s, and is simply not rendered when the service is not delivering.

### The Shelf (signature)
A section header (Headline Section, note, and an outlined "All …" pill) over a bleeding rail of product cards. Every shelf ends with a dashed-border terminator tile. On the homepage three shelves ship, and the third takes the toothed linen-deep ground to break the rhythm.

### The Bag (signature)
The cart is grouped by delivery service, never blended, because one driver cannot carry another company's stock. Each group is its own section under an ink hairline: the service name at Spec size with its arrival window in mono meta, its lines, then its own subtotal, its own delivery fee and its own checkout button reading "Checkout with {service}". A group under its order minimum does not get a checkout button at all — it gets a shortfall note on orange-wash stating exactly how much more is needed to reach that service's minimum. The drawer footer states how many separate orders are in the bag beside the Stat-sized grand total, and repeats the 21+ line. Lines persist to `localStorage`; a private-mode failure is swallowed and the bag simply does not survive a reload.

**The Separate Drivers Rule.** The bag never shows a blended total, a single checkout, or a fee that averages two services. Every commercial figure in the cart belongs to exactly one delivery service, and a total nobody could actually order is not shown at all. A blocked group states the shortfall rather than offering a checkout that would fail.

### Motion
- **The reveal:** `.u-reveal` is a print-wipe — `clip-path: inset(12% 0 0 0)` plus `translateY(14px)` resolving over 0.9s on `cubic-bezier(0.16, 1, 0.3, 1)`, with opacity on a separate 0.5s linear track and a per-item delay of `--i × 0.055s`. It is driven by an IntersectionObserver in `Reveal.jsx` (threshold 0.08, −8% bottom root margin) that fires once and disconnects. Grid items cap their index at 4 on a 5-column cycle so a long catalogue never stalls. Content is never gated by it: the reveal only removes a transform.
- **The marquee:** the brand ribbon drifts 46s linear infinite and pauses on host hover. Its content is mirrored in an `sr-only` list.
- **Reduced motion:** fully honored — the reveal resolves instantly, the marquee stops, smooth scroll is disabled, and all animation and transition durations collapse globally.

**The One Gesture Rule.** This site has exactly one authored entrance and one ambient drift. Everything else is a color transition. Scattered hover animations — scaling cards, sliding icons, parallax — are the failure mode this rule exists to prevent.

## Do's and Don'ts

### Do:
- **Do** take every type size from a named step in the ramp, and give a new size a name, a role and three uses before it ships.
- **Do** keep 0.8 / 0.85 / 0.9 distinct: fine print, control label, copy-inside-chrome. They are close in size and unrelated in role.
- **Do** measure every new color pair and record the ratio next to the token, the way `globals.css` and the ProductLabel colorway table already do.
- **Do** use `orange-text` (`#b8431a`) and `green-text` (`#2f7a34`) for any orange or green word below display size; the pure hues are large-text-and-UI only at ~3.1:1 and ~3.2:1.
- **Do** set drenched bands in ink (5.4:1 on orange, 5.2:1 on green) and use `ember` for their secondary text.
- **Do** reserve mono (`meta` / `data`) for measurable figures — including every ETA, arrival window, fee and order minimum — and route every other uppercase micro-label through `label`.
- **Do** give every `linen-deep` band the `.u-tooth` utility, at the same tile and amplitude as the body ground.
- **Do** open every interior route with `PageHeader`: breadcrumb, Display Page h1 at 18ch, optional blurb and meta. Chrome belongs to `app/layout.jsx`; a route supplies content only.
- **Do** render every product through `ProductCard`, whether it lands in a rail or a grid. One card is the reason the two arrangements match.
- **Do** write filter and sort state to the URL so a filtered view is a shareable address and the back button behaves.
- **Do** group the bag by delivery service, with a per-service subtotal, fee, minimum and checkout, and state the shortfall when a group is under its minimum.
- **Do** keep every control at 44px minimum. The 32px logo mark is the one documented exception, and it sits inside a larger anchor.
- **Do** draw new icons in the existing single-stroke grammar: 24-unit box, no fill, 1.4 stroke, round caps and joins.
- **Do** theme the browser's own surfaces — selection, caret, focus ring, scrollbars, underline offset, tabular numerals. They ship with the design, not with Chrome.
- **Do** render products as authored package labels in one of the five committed colorways, and reach for `size="hero"` when the label is set larger than a card.
- **Do** let shelves bleed off the right edge; the cut card is what tells the reader there is more.
- **Do** re-check the masthead clamp against the fold whenever the headline copy changes length; the first price is above the fold on the current build at 899px of 960px desktop and 825px of 844px mobile, and that margin is the constraint the `clamp(2.05rem, 6.2vw, 4.75rem)` / 20ch pairing was tuned to hold.
- **Do** keep the placeholder-data disclosure in `data/README.md` and in the project README. Business and brand names are real; every rating, price, delivery window, fee and menu figure is invented. The on-page footer disclosure that used to carry this was removed at the user's explicit direction while preparing the site for launch, so the page no longer states it — the data is unchanged, only the notice is gone. Anyone restoring real figures should update both records rather than assume the absence of a notice means the numbers are real.

### Don't:
- **Don't** invent a type size between two steps because something looks slightly off; snap it to the nearest step or argue the new step into the ramp.
- **Don't** add a `box-shadow`. Depth comes from tooth, hairline and ground change.
- **Don't** fade text with opacity on a colored ground; it voids the measured ratio. Use the named dim token for that ground.
- **Don't** apply an opacity or a filter to the ProductLabel colorway strip — it silently breaks all five measured pairs at once.
- **Don't** put `#f15a26` or `#419b45` behind body copy, and don't lighten `mute` back toward `#777380`; that value failed 4.5:1 on linen-deep.
- **Don't** use white type on the orange or green bands.
- **Don't** introduce stock photography, product photos or lifestyle imagery. The label system exists so that never becomes necessary.
- **Don't** dress non-measurement text in mono because it looks technical.
- **Don't** add a second motion gesture. One entrance, one drift.
- **Don't** build a second product card, or a grid-only variant of the existing one. Rail and grid render the same component.
- **Don't** hold filter or sort state where the URL cannot reconstruct it.
- **Don't** show a blended cart total, a single checkout across services, or a checkout on a group under its minimum.
- **Don't** build a card grid where an index row will do, or a filled search box where the hairline field will do — the search-box-over-a-tile-grid layout is the category default this world was built to refuse.
- **Don't** reintroduce pickup vocabulary — a Pickup/Delivery fork, an Open/Closed chip, a store-distance figure on a ticket. This product delivers and only delivers; the ticket carries an arrival window, not a distance.
- **Don't** hardcode a hex in a component where a token exists; the inline literals in the shipped build are a defect to reconcile, not a pattern to copy.
- **Don't** ship a glyph character, an emoji or an icon font in place of a drawn mark.

<!-- PROVENANCE — facts the code cannot carry, recorded for whoever works this surface next.

     THE ROLL RAN DEGRADED. impeccable.style was unreachable during the surface-concept
     round: no catalog challengers were dealt, no QUALITY BAR boards were produced, and no
     comp round ran. The user chose "The Shelf" (FORM index 2 of 7, seed key 4259fa8c) from
     three grounded structures only. Whoever revisits this surface should know what was
     never dealt to it.

     NO COMP IS AUTHORITY. The build was code-led. No approved comp exists for any region of
     this site; the shipped code and the validated captures are the only ground truth.

     THE WORLD IS PINNED. The palette and type ramp were extracted from the actual
     stylesheets of ryeisland.com, a reference the user pinned by name. Weedmaps' own visual
     design was explicitly rejected; the name and the information architecture are all that
     carry over.

     DELIVERY-ONLY. There is no pickup anywhere. ModeContext.jsx was deleted and replaced by
     DeliveryContext.jsx (address + liveOnly + sort). Tickets carry a delivery ETA where they
     carried a distance; service rows carry arrival window, fee, order minimum and a
     Delivering/Paused chip.

     POSTGRES. Catalogue data comes from Neon via Drizzle. db/schema.js holds categories,
     subcategories, brands, shops, products; money in integer cents, potency numeric(5,2);
     a deal is a product carrying was_price_cents, not a table. db/queries.js reshapes rows
     into the shapes the components already expected. Seeded live: 9 categories, 71
     subcategories, 80 brands, 18 delivery services, 152 products, 19 live deals. data/ holds
     only site.json and learn.json.

     THIS PASS. Two changes, both reconciled in code by the user before re-recording.
     (1) THE TYPE RAMP WAS UNDER-DOCUMENTED, NOT SLOPPY. The previous record described the
     ramp as three broad bands and the detector reported the gap as drift (67 advisory
     findings at peak). The audit found each of 0.8 / 0.85 / 0.9 carrying a distinct and
     consistently applied role, so they were kept as three steps and named rather than
     collapsed. Two subtitle lines wearing the control size were snapped from 0.85 to 0.9
     (CategoryIndex.jsx, app/products/page.jsx); two genuine singletons were removed
     (ShopList's service heading 1.1 → 1.15, DealsBand's price 1.25 → 1.15). Nothing else was
     touched. Counts in the Typography section are the shipped counts across app/ and
     components/; no singletons remain.
     (2) THE SITE IS TEN ROUTES. app/layout.jsx became the shell (Header, LocationBar, Footer,
     AgeGate, CartDrawer, and the shop read). New components: PageHeader (+ Breadcrumb,
     BackLink), ProductGrid, ProductCard (extracted from Shelf so rails and grids share one
     card), FilterBar, SearchField, CartContext, CartDrawer, AddToCart. ProductLabel gained
     size="hero" for the 420px product-detail label. Icons gained plus, minus, trash. No new
     visual language was introduced by any of it.

     FINISH REVIEW IS STALE. Disposition ship, scoped to eight material fixes plus one
     regression and one residual — on the homepage, before the delivery-only change, before
     the Postgres migration, and before every route added in this pass. It reviewed none of
     them. It is not a certification of this site and must not be cited as one. Nine of the
     ten routes have never been through a finish review.

     NOT CANONIZED — carried by the build, not design-system rules:
       · Inline hex literals in LocationBar and ShopList (#1f4a21, #8f3312, #2f7a34) and in
         CartDrawer's shortfall note (#f9c5b3 / #8f3312). Tokens exist for all of them.
       · The `opacity-70` label on the store buttons, and the `opacity-60` on the filter-chip
         count — contrast by opacity is exactly what The No-Opacity-On-Color Rule forbids.
       · The deck line under each Learn article title.
       · The 0.7rem filter-chip count: a single-use size outside the ramp.
       · The 36px (h-9) controls in FilterBar and the cart's quantity stepper and remove
         button. They ship, but the 44px minimum stands as the rule; these are under it and
         are a defect to reconcile, not a compact tier to inherit.

     CAPTURES: .impeccable/review/desktop.png (1440x7555), mobile.png (390x11312),
     desktop-hero.png (1440x960), mobile-hero.png (390x844) for the homepage; page-category,
     page-product, page-delivery, page-brands, page-deals .png for the interior routes. Fold
     probe on the homepage build: desktop first price bottom 899px vs 960px fold; mobile 825px
     vs 844px.

     STACK NOTE: the `motion` package is installed but unused. What ships is the CSS plus
     IntersectionObserver reveal documented above.
-->
