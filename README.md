# Weedmaps

A **delivery-only** cannabis marketplace. Information architecture follows
weedmaps.com; the visual world does not — it is built on the design language of
[ryeisland.com](https://ryeisland.com), pinned by the client.

There is no pickup anywhere in this product. Every order is delivered, and the
delivery address is the master state the whole page hangs off.

Homepage only, this pass.

## Run it

```bash
npm install
npm run dev      # http://localhost:3100
```

Needs `.env.local` with `DATABASE_URL`. It is pulled from Neon, not committed:

```bash
npx neon env pull
```

## Database

Neon Postgres, accessed with Drizzle ORM from server components.

```bash
npm run db:push     # apply db/schema.js to the database
npm run db:seed     # truncate and reseed from db/*.js
npm run db:reset    # both, in order
npm run db:studio   # browse the data
```

| Table | Holds |
|---|---|
| `categories` | The 9 top-level product categories |
| `subcategories` | 71 subcategories beneath them |
| `brands` | 80 cannabis brands |
| `shops` | Licensed delivery services — arrival window, fee, minimum |
| `products` | The catalogue, joined to brand, category, subcategory and service |

Deals are not a table: they are products carrying a `was_price_cents`, so a
discount is a property of the product rather than a duplicate row.

## Routes

| Route | What |
|---|---|
| `/` | Homepage — shelves, categories, deals, services, brands |
| `/products` | Category index + the whole catalogue |
| `/products/[category]` | Category page with subcategory filters and sorting |
| `/product/[slug]` | Product detail, add to bag, related items |
| `/deliveries` | Every delivery service |
| `/delivery/[slug]` | One service and its full menu, grouped by category |
| `/brands` | A–Z brand directory |
| `/brand/[slug]` | One brand and its catalogue |
| `/deals` | Everything discounted tonight |
| `/search?q=` | Search across product, brand, category and strain type |

Category, product, brand and delivery pages are statically generated from the
database at build time and revalidate every 60 seconds.

## The bag

Cart state lives in `components/CartContext.jsx`, persisted to `localStorage`.

It is **grouped by delivery service**, because one driver cannot carry another
company’s stock: each group carries its own subtotal, delivery fee, order
minimum and checkout button, and a group below its minimum says how much more
it needs rather than offering a checkout that would fail.

Checkout itself is not implemented — see the gaps below.

## Where things live

| Path | What |
|---|---|
| `app/page.jsx` | The homepage — queries the DB, composes sections |
| `app/layout.jsx` | Fonts, metadata, and the direction contract |
| `app/globals.css` | Design tokens, type roles, motion, browser surfaces |
| `components/` | Every section and the shared primitives |
| `db/schema.js` | Table definitions |
| `db/queries.js` | Every read the homepage makes |
| `db/seed.js` | Seeding, from the data files beside it |
| `data/` | Site chrome and editorial copy only |
| `PRODUCT.md` | Product truth: users, positioning, constraints |
| `DESIGN.md` | The visual system, recorded from the built page |

## Changing the catalogue

Edit the data files in `db/` — `taxonomy.js` for categories and brands,
`shops.js` for delivery services, `products-a..d.js` for the catalogue — then
`npm run db:seed`. No component changes needed.

**The demo data is placeholder.** Business and brand names are real companies;
every price, rating, review count, arrival window, fee and menu figure attached
to them is invented. See `data/README.md`. The footer disclosure should stay
until live data replaces the seed.

## The structure

One idea: **you shop the product, not the shop.** Rather than a search box over a
grid of dispensary tiles, the page opens as shelves — products at real prices,
each ticket naming the service that brings it and how soon it arrives.

The address, the *delivering now* filter and the *fastest / top-rated* sort are
the master state (`components/DeliveryContext.jsx`). All three drive the counted
statement and the service list; none is decorative.

## What is not built yet

Honest list, so nothing here reads as finished when it is not:

- **Checkout, accounts and payments.** The bag is real and persists; the
  checkout button is a stub. No auth, no orders table, no payment.
- **Real location.** The address field is free text. It does not geocode, and
  service coverage is not actually computed from it.
- **Live inventory.** Everything is seeded. No integration with any real menu.
- **Reviews.** Ratings and counts are seeded numbers with no reviews behind them.
- **Strains and Learn.** Nav-level content that exists on the real site; the
  editorial cards on the homepage do not link to articles yet.
- **Pagination.** Category pages cap at 120 rows and the catalogue at 200.
- **Type ramp reconciliation.** The design detector reports advisory drift where
  small text uses three adjacent sizes for one job. See DESIGN.md.
