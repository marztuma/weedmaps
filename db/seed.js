import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as raw } from "drizzle-orm";
import * as schema from "./schema.js";
import { CATEGORIES, BRANDS } from "./taxonomy.js";
import { SHOPS } from "./shops.js";
import { FLOWER, PREROLLS } from "./products-a.js";
import { VAPE, CONCENTRATES } from "./products-b.js";
import { EDIBLES, BEVERAGES } from "./products-c.js";
import { WELLNESS, GEAR, GENETICS } from "./products-d.js";

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 150);

const CATALOG = [
  ["flower", FLOWER], ["pre-rolls", PREROLLS], ["vape", VAPE],
  ["concentrates", CONCENTRATES], ["edibles", EDIBLES], ["beverages", BEVERAGES],
  ["wellness", WELLNESS], ["gear", GEAR], ["genetics", GENETICS],
];

async function main() {
  console.log("clearing existing rows…");
  await db.execute(raw`TRUNCATE TABLE products, subcategories, categories, brands, shops RESTART IDENTITY CASCADE`);

  console.log("seeding categories + subcategories…");
  const catIds = {};
  const subIds = {};
  for (const c of CATEGORIES) {
    const [row] = await db.insert(schema.categories)
      .values({ slug: c.slug, name: c.name, blurb: c.blurb, sortOrder: c.sortOrder })
      .returning({ id: schema.categories.id });
    catIds[c.slug] = row.id;
    const subRows = await db.insert(schema.subcategories).values(
      c.subs.map((name, i) => ({
        categoryId: row.id, slug: slugify(name), name, sortOrder: i + 1,
      }))
    ).returning({ id: schema.subcategories.id, name: schema.subcategories.name });
    for (const s of subRows) subIds[`${c.slug}::${s.name}`] = s.id;
  }

  console.log("seeding brands…");
  const brandIds = {};
  const brandRows = await db.insert(schema.brands).values(
    BRANDS.map(([name, kind, featured]) => ({ slug: slugify(name), name, kind, featured }))
  ).returning({ id: schema.brands.id, name: schema.brands.name });
  for (const b of brandRows) brandIds[b.name] = b.id;

  console.log("seeding delivery services…");
  const shopIds = [];
  const shopRows = await db.insert(schema.shops).values(
    SHOPS.map(([name, serviceArea, license, rating, reviewCount, deliveringNow,
                windowLabel, etaMinMinutes, etaMaxMinutes, minOrderCents,
                deliveryFeeCents, freeDeliveryOverCents, menuCount, deal]) => ({
      slug: slugify(name), name, serviceArea, license, rating: String(rating), reviewCount,
      deliveringNow, windowLabel, etaMinMinutes, etaMaxMinutes, minOrderCents,
      deliveryFeeCents, freeDeliveryOverCents, menuCount, deal,
    }))
  ).returning({ id: schema.shops.id, deliveringNow: schema.shops.deliveringNow });
  for (const s of shopRows) if (s.deliveringNow) shopIds.push(s.id);

  console.log("seeding products…");
  let n = 0, cursor = 0;
  for (const [catSlug, items] of CATALOG) {
    const values = items.map(([brand, name, sub, strainType, weight, thc, cbd, price, was, colorway, tags], i) => {
      const brandId = brandIds[brand];
      if (!brandId) throw new Error(`Unknown brand in ${catSlug}: ${brand}`);
      const shopId = shopIds[cursor++ % shopIds.length];
      // deterministic demo distance, 0.8–9.5 mi
      const distance = Math.round((0.8 + ((i * 7 + cursor * 3) % 88) / 10) * 10) / 10;
      return {
        slug: `${catSlug}-${slugify(brand)}-${slugify(name)}`,
        name, brandId, categoryId: catIds[catSlug],
        subcategoryId: subIds[`${catSlug}::${sub}`] ?? null,
        shopId, strainType, weight,
        thc: String(thc), cbd: String(cbd),
        priceCents: price * 100,
        wasPriceCents: was ? was * 100 : null,
        distanceMi: String(Math.min(distance, 9.5)),
        colorway, tags: tags ?? [],
        featured: i < 8,
      };
    });
    await db.insert(schema.products).values(values);
    n += values.length;
    console.log(`  ${catSlug.padEnd(13)} ${values.length}`);
  }

  const counts = await db.execute(raw`
    select
      (select count(*) from categories)    as categories,
      (select count(*) from subcategories) as subcategories,
      (select count(*) from brands)        as brands,
      (select count(*) from shops)         as shops,
      (select count(*) from products)      as products,
      (select count(*) from products where was_price_cents is not null) as deals`);
  console.log("\nseeded:", counts.rows?.[0] ?? counts[0]);
  console.log(`total products inserted: ${n}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
