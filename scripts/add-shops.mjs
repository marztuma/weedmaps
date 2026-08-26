import { config } from "dotenv";
config({ path: ".env.local" });

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql as raw } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Additional licensed delivery services. Names are real businesses; every
   rating, window, fee, minimum and review count is demonstration data, as the
   footer discloses. Delivery-only — no pickup rows exist in this product. */

const NEW_SHOPS = [
  ["Hyperwolf", "LA · OC · SD", "Adult use · C9", 4.4, 5920, true, "Until 11:00 PM", 45, 90, 5000, 0, 6000, "Free delivery over $60"],
  ["Kushfly", "LA Metro", "Adult use · C9", 4.3, 3410, true, "Until 10:00 PM", 50, 95, 6000, 0, 6000, null],
  ["The Artist Tree", "West Hollywood", "Adult use · C10", 4.7, 2280, true, "Until 9:00 PM", 40, 70, 4500, 500, 8000, null],
  ["Herbarium", "Melrose", "Adult use · C10", 4.6, 1890, true, "Until 10:00 PM", 35, 65, 4000, 500, 7500, "15% off first order"],
  ["Cornerstone Wellness", "Eagle Rock", "Adult use · C10", 4.5, 1420, true, "Until 9:30 PM", 45, 80, 4000, 400, 7000, null],
  ["Zen Garden", "Van Nuys", "Adult use · C10", 4.4, 990, true, "Until 10:00 PM", 40, 75, 3500, 500, 7000, null],
  ["Tale of Two Strains", "Sherman Oaks", "Adult use · C9", 4.2, 760, true, "Until 11:00 PM", 55, 100, 3000, 600, 9000, "BOGO edibles"],
  ["Green Nation", "Long Beach", "Adult use · C10", 4.5, 2140, true, "Until 10:00 PM", 40, 80, 4000, 500, 8000, null],
  ["Higher Level", "Inglewood", "Adult use · C10", 4.3, 1180, true, "Until 9:00 PM", 45, 85, 3500, 500, 7500, null],
  ["Grasshopper Delivery", "South Bay", "Adult use · C9", 4.1, 640, true, "Until 12:00 AM", 60, 110, 3000, 700, 10000, null],
  ["March and Ash", "San Diego", "Adult use · C10", 4.6, 3050, false, "Opens 8:00 AM", 50, 90, 4000, 500, 8000, "20% off concentrates"],
  ["Torrey Holistics", "San Diego", "Adult use · C10", 4.7, 2670, false, "Opens 9:00 AM", 45, 85, 4500, 0, 4500, null],
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const existing = await db.select({ slug: schema.shops.slug }).from(schema.shops);
  const have = new Set(existing.map((s) => s.slug));

  const values = NEW_SHOPS
    .filter(([name]) => !have.has(slugify(name)))
    .map(([name, area, license, rating, reviews, live, window, etaMin, etaMax, min, fee, freeOver, deal]) => ({
      slug: slugify(name), name, serviceArea: area, license,
      rating: String(rating), reviewCount: reviews, deliveringNow: live,
      windowLabel: window, etaMinMinutes: etaMin, etaMaxMinutes: etaMax,
      minOrderCents: min, deliveryFeeCents: fee, freeDeliveryOverCents: freeOver,
      menuCount: 0, deal,
    }));

  if (values.length) await db.insert(schema.shops).values(values);
  console.log(`added ${values.length} delivery services (${NEW_SHOPS.length - values.length} already existed)`);

  /* Spread products across every delivering service. Without this the new
     services list with an empty menu, which the dashboard rightly flags. */
  const live = await db.select({ id: schema.shops.id }).from(schema.shops)
    .where(eq(schema.shops.deliveringNow, true));
  const products = await db.select({ id: schema.products.id }).from(schema.products)
    .orderBy(schema.products.id);

  console.log(`redistributing ${products.length} products across ${live.length} delivering services…`);
  for (let i = 0; i < products.length; i++) {
    await db.update(schema.products)
      .set({ shopId: live[i % live.length].id })
      .where(eq(schema.products.id, products[i].id));
  }

  const counts = await db.select({
    name: schema.shops.name,
    live: schema.shops.deliveringNow,
    n: raw`count(${schema.products.id})`.mapWith(Number),
  }).from(schema.shops)
    .leftJoin(schema.products, eq(schema.products.shopId, schema.shops.id))
    .groupBy(schema.shops.id, schema.shops.name, schema.shops.deliveringNow)
    .orderBy(raw`count(${schema.products.id}) desc`);

  const [{ total }] = await db.select({ total: raw`count(*)`.mapWith(Number) }).from(schema.shops);
  console.log(`\ndelivery services: ${total}`);
  console.log(`empty menus:       ${counts.filter((c) => c.n === 0).length}`);
  console.log("\ntop services by menu size:");
  counts.slice(0, 8).forEach((c) =>
    console.log(`  ${c.name.padEnd(24)} ${String(c.n).padStart(3)} items ${c.live ? "" : "(paused)"}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
