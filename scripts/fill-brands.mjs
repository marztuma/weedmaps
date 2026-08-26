import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, sql as raw } from "drizzle-orm";
import * as schema from "../db/schema.js";
import { BRAND_LISTINGS } from "../db/brand-listings.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Give a brand its real products, each on a photograph from its own category.
   Idempotent: a product already present under that brand and name is skipped,
   so this can run every time a new brand block is added. */

function seeded(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const between = (lo, hi, s) => Math.round(lo + seeded(s) * (hi - lo));
const pick = (a, s) => a[Math.floor(seeded(s) * a.length) % a.length];

const PRICE = {
  flower: [28, 78], "pre-rolls": [9, 48], vape: [22, 68], concentrates: [32, 110],
  edibles: [16, 34], beverages: [7, 30], gear: [4, 140], wellness: [18, 65], genetics: [40, 180],
};
const THC = {
  flower: [17, 33], "pre-rolls": [19, 42], vape: [72, 93], concentrates: [58, 96],
  edibles: [5, 25], beverages: [2, 10], gear: [0, 0], wellness: [3, 30], genetics: [0, 0],
};
const COLORWAYS = ["ink", "orange", "purple", "green", "linen"];
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-{2,}/g, "-").slice(0, 120);

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "products", "manifest.json"), "utf8")
  );

  const [cats, brandRows, shopRows, subRows] = await Promise.all([
    db.select({ id: schema.categories.id, slug: schema.categories.slug }).from(schema.categories),
    db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands),
    db.select({ id: schema.shops.id, live: schema.shops.deliveringNow }).from(schema.shops),
    db.select({ id: schema.subcategories.id, name: schema.subcategories.name, categoryId: schema.subcategories.categoryId })
      .from(schema.subcategories),
  ]);

  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  const brandId = new Map(brandRows.map((b) => [b.name.toLowerCase(), b.id]));
  const liveShops = shopRows.filter((s) => s.live).map((s) => s.id);
  const subId = new Map(subRows.map((s) => [`${s.categoryId}::${s.name}`, s.id]));

  // where each category's photography sits, and how far through it we are
  const cursor = {};

  /* Slugs are the product's public URL and are unique in the database. Two
     sizes of one product share a name, so the weight disambiguates them; if
     even that repeats, a counter does. Seeded from what is already stored so a
     re-run cannot collide with an earlier one. */
  const takenSlugs = new Set(
    (await db.select({ slug: schema.products.slug }).from(schema.products)).map((r) => r.slug)
  );
  function uniqueSlug(base, weight) {
    const trim = (s) => s.slice(0, 150);
    let candidate = trim(base);
    if (!takenSlugs.has(candidate)) { takenSlugs.add(candidate); return candidate; }

    if (weight) {
      candidate = trim(`${base}-${slugify(String(weight))}`);
      if (!takenSlugs.has(candidate)) { takenSlugs.add(candidate); return candidate; }
    }
    for (let n = 2; ; n++) {
      candidate = trim(`${base}-${n}`);
      if (!takenSlugs.has(candidate)) { takenSlugs.add(candidate); return candidate; }
    }
  }

  let created = 0, skipped = 0, cursorShop = 0;

  for (const [brand, listings] of Object.entries(BRAND_LISTINGS)) {
    let bid = brandId.get(brand.toLowerCase());
    if (!bid) {
      const [row] = await db.insert(schema.brands)
        .values({ slug: slugify(brand), name: brand, kind: null, featured: false })
        .returning({ id: schema.brands.id });
      bid = row.id;
      brandId.set(brand.toLowerCase(), bid);
      console.log(`  + brand: ${brand}`);
    }

    const existing = await db.select({ name: schema.products.name, weight: schema.products.weight })
      .from(schema.products).where(eq(schema.products.brandId, bid));
    // Identity is name + weight: the same product in another size is another
    // listing, not a duplicate.
    const have = new Set(existing.map((e) => `${e.name.toLowerCase()}|${e.weight ?? ""}`));

    const values = [];
    for (const [name, category, sub, weight, strain] of listings) {
      const identity = `${name.toLowerCase()}|${weight ?? ""}`;
      if (have.has(identity)) { skipped++; continue; }
      have.add(identity);

      const cid = catId.get(category);
      if (!cid) { console.log(`  ! unknown category "${category}" for ${name}`); continue; }

      const pool = manifest[category] ?? [];
      cursor[category] = (cursor[category] ?? 0) + 1;
      const img = pool.length ? pool[cursor[category] % pool.length] : null;

      const seed = `${brand}|${name}`;
      const [lo, hi] = PRICE[category] ?? [20, 60];
      const price = between(lo, hi, seed + "p");
      const onSale = seeded(seed + "s") < 0.18;
      const [tlo, thi] = THC[category] ?? [20, 30];
      const isGear = strain === "Accessory";

      values.push({
        slug: uniqueSlug(`${category}-${slugify(brand)}-${slugify(name)}`, weight),
        name,
        brandId: bid,
        categoryId: cid,
        subcategoryId: subId.get(`${cid}::${sub}`) ?? null,
        shopId: liveShops[cursorShop++ % liveShops.length],
        strainType: strain,
        weight,
        thc: String(isGear ? 0 : between(tlo, thi, seed + "t")),
        cbd: String(seeded(seed + "c") < 0.3 ? (seeded(seed + "c2") * 3).toFixed(1) : 0),
        priceCents: price * 100,
        wasPriceCents: onSale ? Math.round(price * 1.3) * 100 : null,
        distanceMi: String((1 + seeded(seed + "d") * 8).toFixed(1)),
        colorway: pick(COLORWAYS, seed + "w"),
        imageAvif: img?.avif ?? null,
        imageWebp: img?.webp ?? null,
        imageAlt: img ? `${brand} ${name} — ${category.replace("-", " ")}` : null,
        tags: onSale ? ["Deal"] : [],
        featured: seeded(seed + "f") < 0.15,
      });
    }

    if (values.length) {
      for (let i = 0; i < values.length; i += 40) {
        await db.insert(schema.products).values(values.slice(i, i + 40));
      }
      created += values.length;
      console.log(`  ${brand.padEnd(22)} +${values.length} products`);
    }
  }

  const [{ total, empty }] = await db.select({
    total: raw`(select count(*) from ${schema.brands})`.mapWith(Number),
    empty: raw`(select count(*) from ${schema.brands} b where not exists
      (select 1 from ${schema.products} p where p.brand_id = b.id))`.mapWith(Number),
  }).from(raw`(select 1) as t`);

  console.log(`\ncreated ${created} products, skipped ${skipped} already present`);
  console.log(`brands: ${total} total, ${empty} still without products`);
}

main().catch((e) => { console.error(e); process.exit(1); });
