import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray, sql as raw } from "drizzle-orm";
import * as schema from "../db/schema.js";
import { CATALOGUE } from "../db/weedmaps-catalogue.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Build the catalogue from the real weedmaps.com listings, pairing each one with
   a photograph from the client's folder for that same category.

   The name, brand, form and size are the real listing. The picture is a real
   photograph of that category of product. They are matched by category, not by
   SKU, so the footer disclosure says exactly that.

   Figures are deterministic from the product name, so re-running produces the
   same catalogue rather than reshuffling prices under existing orders. */

function seeded(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const between = (lo, hi, s) => Math.round(lo + seeded(s) * (hi - lo));
const pick = (arr, s) => arr[Math.floor(seeded(s) * arr.length) % arr.length];

const PRICE = {
  flower: [28, 78], "pre-rolls": [9, 48], vape: [22, 68], concentrates: [32, 110],
  edibles: [16, 34], beverages: [7, 30], gear: [4, 140],
};
const THC = {
  flower: [17, 33], "pre-rolls": [19, 42], vape: [72, 93], concentrates: [58, 96],
  edibles: [5, 25], beverages: [2, 10], gear: [0, 0],
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

  // brands named in the real listings that we do not carry yet
  const needed = new Set();
  for (const items of Object.values(CATALOGUE)) for (const [, brand] of items) needed.add(brand);
  for (const name of needed) {
    if (brandId.has(name.toLowerCase())) continue;
    const [row] = await db.insert(schema.brands)
      .values({ slug: slugify(name), name, kind: null, featured: false })
      .returning({ id: schema.brands.id });
    brandId.set(name.toLowerCase(), row.id);
    console.log(`  + brand: ${name}`);
  }

  // wipe only the photographed categories; wellness and genetics keep their
  // hand-written products and authored labels
  const replaceIds = Object.keys(CATALOGUE).map((s) => catId.get(s)).filter(Boolean);
  await db.delete(schema.products).where(inArray(schema.products.categoryId, replaceIds));

  const values = [];
  const report = [];
  let cursor = 0;

  for (const [category, listings] of Object.entries(CATALOGUE)) {
    const cid = catId.get(category);
    if (!cid) continue;
    const images = manifest[category] ?? [];
    if (!images.length) { report.push([category, 0, 0, listings.length]); continue; }

    // one product per real listing; images cycle if there are fewer than listings
    const used = new Set();
    let made = 0;

    listings.forEach(([name, brand, sub, weight, strain], i) => {
      const bid = brandId.get(brand.toLowerCase());
      if (!bid) return;

      const img = images[i % images.length];
      used.add(img.slug);

      const seed = `${category}|${brand}|${name}`;
      const [lo, hi] = PRICE[category] ?? [20, 60];
      const price = between(lo, hi, seed + "p");
      const onSale = seeded(seed + "s") < 0.18;
      const [tlo, thi] = THC[category] ?? [20, 30];
      const isGear = category === "gear" || strain === "Accessory";

      values.push({
        slug: `${category}-${slugify(brand)}-${slugify(name)}`.slice(0, 150),
        name,
        brandId: bid,
        categoryId: cid,
        subcategoryId: subId.get(`${cid}::${sub}`) ?? null,
        shopId: liveShops[cursor++ % liveShops.length],
        strainType: strain,
        weight,
        thc: String(isGear ? 0 : between(tlo, thi, seed + "t")),
        cbd: String(seeded(seed + "c") < 0.3 ? (seeded(seed + "c2") * 3).toFixed(1) : 0),
        priceCents: price * 100,
        wasPriceCents: onSale ? Math.round(price * 1.3) * 100 : null,
        distanceMi: String((1 + seeded(seed + "d") * 8).toFixed(1)),
        colorway: pick(COLORWAYS, seed + "w"),
        imageAvif: img.avif,
        imageWebp: img.webp,
        imageAlt: `${brand} ${name} — ${category.replace("-", " ")}`,
        tags: onSale ? ["Deal"] : [],
        featured: seeded(seed + "f") < 0.15,
      });
      made++;
    });

    report.push([category, made, used.size, images.length]);
  }

  for (let i = 0; i < values.length; i += 40) {
    await db.insert(schema.products).values(values.slice(i, i + 40));
  }

  const byCat = await db.select({
    cat: schema.categories.name,
    n: raw`count(*)`.mapWith(Number),
    img: raw`count(*) filter (where ${schema.products.imageAvif} is not null)`.mapWith(Number),
  }).from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .groupBy(schema.categories.id, schema.categories.name, schema.categories.sortOrder)
    .orderBy(schema.categories.sortOrder);

  const [{ total }] = await db.select({ total: raw`count(*)`.mapWith(Number) }).from(schema.products);

  console.log("\ncategory        products  photos used  photos available");
  for (const [cat, made, used, avail] of report) {
    console.log(`${cat.padEnd(15)} ${String(made).padStart(8)} ${String(used).padStart(12)} ${String(avail).padStart(17)}`);
  }
  console.log(`\ntotal products in the database: ${total}`);
  console.log("\nby category (includes wellness + genetics on authored labels):");
  for (const r of byCat) console.log(`  ${r.cat.padEnd(15)} ${String(r.n).padStart(4)} products, ${r.img} with a photo`);
}

main().catch((e) => { console.error(e); process.exit(1); });
