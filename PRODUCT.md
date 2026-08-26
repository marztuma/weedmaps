# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + Tailwind CSS. Catalogue data lives in Neon Postgres, queried through Drizzle ORM in server components; only site chrome and editorial copy remain as JSON. Stack specified by the user.

## Users

Primary: an adult cannabis consumer, on a phone, deciding where to buy right now. They arrive with a location and an intent that is one of three shapes — "what's open near me", "who has the cheapest X", or "what should I try". They are price-aware, deal-driven, and comparing two or three shops before committing.

Secondary: the newer or returning-after-years consumer who does not know the product vocabulary (what a "live rosin" is, what THCa means) and needs the taxonomy to teach them while they browse.

Tertiary (not a build target this pass): the retailer or brand managing a listing.

## Product Purpose

Weedmaps is a delivery-only discovery marketplace connecting cannabis consumers with licensed delivery services and brands that reach their address. There is no pickup: every order is delivered. Success is a consumer going from "open the site" to "I know who is bringing it and when" in under a minute, with enough confidence in the menu, price, fee and arrival window not to check a second site.

## Positioning

Marketplace-first, not content-first. The competitive axis against a content-led directory is live commercial truth: current menus, current prices, current deals, and whether the shop is open and delivering to this address right now. Editorial exists to serve the purchase, not the other way around.

## Operating Context

Mobile-dominant, often on cellular, usually at home waiting on a delivery. The address is the master filter — nearly every surface is meaningless without it, and it determines which services can reach the visitor at all. Arrival window, delivery fee and order minimum are first-class commercial facts, not fine print. Legal status is state-by-state, so listings are jurisdiction-scoped, age-gating is a real constraint, and someone 21+ must be present to receive the delivery.

## Capabilities and Constraints

- Listing types: licensed delivery services and brands. There is no pickup listing type, no storefront collection flow, and no in-store affordance anywhere in the product.
- Product taxonomy, confirmed against the live site: Flower, Pre-rolls, Vape pens, Concentrates, Edibles, Beverages, Wellness/Topicals, Accessories/Gear, Genetics/Cultivation. Each carries subcategories (e.g. Concentrates → rosin, badder, shatter, diamonds, hash, kief).
- Service card fields: name, star rating + review count, delivering/paused state, arrival window, delivery fee, order minimum, menu size, license type, deal flag.
- Core filters: delivering now, deals, category, subcategory, price, brand, potency; sort by soonest arrival or rating.
- Age gate is a category requirement.
- Catalogue is a real Postgres schema (categories, subcategories, brands, shops, products) on Neon. No auth, cart, checkout or payments yet.

## Brand Commitments

- Name: Weedmaps.
- Binding visual reference supplied by the user: ryeisland.com. Its system, extracted from source: linen #f9f5f2, near-black #141314, orange #f15a26, purple #7755a3, green #419b45, neutrals #777380/#5f5c66/#3c3a40/#a09da6/#d6d5d9; Manrope variable 200–800 with a mono face for uppercase labels; display tracking −0.04em; low radii (4/6/10px) with 50px pill CTAs; ~1200px container; staggered scroll reveals (0.15s stagger, 0.3s base delay).
- The user explicitly rejected Weedmaps' own visual design. Rye Island's world replaces it; the Weedmaps name and information architecture are what carry over.

## Evidence on Hand

No real menus, prices, inventory, ratings, or reviews. At the user's explicit direction, demo listings use real dispensary and brand names with invented ratings, hours, distances and menu data; the fixture files must carry a placeholder marker so those figures are never mistaken for real business data. No photography assets supplied.

## Product Principles

1. The delivery address is decided before anything else on the page can be trusted.
2. Commercial truth outranks editorial — price, delivering state, arrival window and fee are never decoration.
3. Teach the taxonomy inside the browse flow, not in a separate education silo.
4. The category's legal seriousness is carried by precision and restraint, not by warning banners.
5. Mobile is the design case; desktop is the adaptation.

## Accessibility & Inclusion

Outdoor/mobile use makes contrast and tap-target size functional requirements, not compliance items. Target WCAG AA: 4.5:1 body text, 44px minimum touch targets, visible focus, and reduced-motion honored across the staggered reveals.
