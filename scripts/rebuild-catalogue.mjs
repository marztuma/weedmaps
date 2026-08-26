import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray, notInArray, sql as raw } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Rebuild the photographed part of the catalogue so every product is named after
   its own picture.

   Wellness and genetics have no source photography, so their hand-written
   products are left untouched and keep the authored package label. Everything
   else is replaced by products derived from the images.

   Figures are deterministic from the slug, so re-running produces the same
   catalogue rather than reshuffling prices under existing orders. */

const CATS = { flower: 1, "pre-rolls": 2, vape: 3, concentrates: 4, edibles: 5, beverages: 6, gear: 8 };

// Stable pseudo-random in [0,1) from a string.
function seeded(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const pick = (arr, s) => arr[Math.floor(seeded(s) * arr.length) % arr.length];
const between = (lo, hi, s) => Math.round(lo + seeded(s) * (hi - lo));

const PRICE = {
  flower: [25, 70], "pre-rolls": [8, 45], vape: [25, 65], concentrates: [28, 95],
  edibles: [14, 32], beverages: [6, 28], gear: [4, 150],
};
const THC = {
  flower: [17, 33], "pre-rolls": [19, 42], vape: [72, 93], concentrates: [58, 96],
  edibles: [5, 25], beverages: [2, 10], gear: [0, 0],
};
const COLORWAYS = ["ink", "orange", "purple", "green", "linen"];
const DEFAULT_SUB = {
  flower: "Whole bud", "pre-rolls": "Singles", vape: "Cartridges",
  concentrates: "Live rosin", edibles: "Gummies", beverages: "Seltzers", gear: "Grinders",
};

async function main() {
  const derived = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "products", "derived.json"), "utf8")
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public", "products", "manifest.json"), "utf8")
  );
  const imgBySlug = new Map(
    Object.values(manifest).flat().map((i) => [i.slug, i])
  );

  const [cats, brandRows, shopRows, subRows] = await Promise.all([
    db.select({ id: schema.categories.id, slug: schema.categories.slug }).from(schema.categories),
    db.select({ id: schema.brands.id, name: schema.brands.name, slug: schema.brands.slug }).from(schema.brands),
    db.select({ id: schema.shops.id, live: schema.shops.deliveringNow }).from(schema.shops),
    db.select({ id: schema.subcategories.id, name: schema.subcategories.name, categoryId: schema.subcategories.categoryId }).from(schema.subcategories),
  ]);

  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  const brandId = new Map(brandRows.map((b) => [b.name.toLowerCase(), b.id]));
  const liveShops = shopRows.filter((s) => s.live).map((s) => s.id);
  const subId = new Map(subRows.map((s) => [`${s.categoryId}::${s.name}`, s.id]));
  const brandPool = brandRows.map((b) => b.name);

  // create any brand the filenames named that we do not already carry
  const needed = new Set();
  for (const items of Object.values(derived)) {
    for (const d of items) if (d.named && d.brand) needed.add(d.brand);
  }
  for (const name of needed) {
    if (brandId.has(name.toLowerCase())) continue;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [row] = await db.insert(schema.brands)
      .values({ slug, name, kind: null, featured: false })
      .returning({ id: schema.brands.id });
    brandId.set(name.toLowerCase(), row.id);
    console.log(`  + brand: ${name}`);
  }

  // clear only the photographed categories; wellness and genetics survive
  const replaceIds = Object.keys(CATS).map((s) => catId.get(s)).filter(Boolean);
  const kept = await db.select({ n: raw`count(*)`.mapWith(Number) })
    .from(schema.products).where(notInArray(schema.products.categoryId, replaceIds));
  await db.delete(schema.products).where(inArray(schema.products.categoryId, replaceIds));

  const values = [];
  const seenSlug = new Set();
  let cursor = 0;

  for (const [category, items] of Object.entries(derived)) {
    const cid = catId.get(category);
    if (!cid) continue;

    for (const d of items) {
      if (!d.named) continue;                   // no honest name → not a product
      const img = imgBySlug.get(d.slug);
      if (!img) continue;

      const seed = d.slug;
      const brandName = d.brand ?? pick(brandPool, seed + "b");
      const bid = brandId.get(brandName.toLowerCase());
      if (!bid) continue;

      const [lo, hi] = PRICE[category] ?? [20, 60];
      const price = between(lo, hi, seed + "p");
      const onSale = seeded(seed + "s") < 0.16;
      const [tlo, thi] = THC[category] ?? [20, 30];

      let slug = `${category}-${d.slug}`.slice(0, 150);
      let n = 2;
      while (seenSlug.has(slug)) slug = `${category}-${d.slug}-${n++}`.slice(0, 150);
      seenSlug.add(slug);

      const subName = d.sub ?? DEFAULT_SUB[category];

      values.push({
        slug,
        name: d.name,
        brandId: bid,
        categoryId: cid,
        subcategoryId: subId.get(`${cid}::${subName}`) ?? null,
        shopId: liveShops[cursor++ % liveShops.length],
        strainType: category === "gear" ? "Accessory" : d.strain,
        weight: d.weight,
        thc: String(category === "gear" ? 0 : between(tlo, thi, seed + "t")),
        cbd: String(seeded(seed + "c") < 0.25 ? (seeded(seed + "c2") * 2).toFixed(1) : 0),
        priceCents: price * 100,
        wasPriceCents: onSale ? Math.round(price * 1.3) * 100 : null,
        distanceMi: String((1 + seeded(seed + "d") * 8).toFixed(1)),
        colorway: pick(COLORWAYS, seed + "w"),
        imageAvif: img.avif,
        imageWebp: img.webp,
        imageAlt: `${brandName} ${d.name} — ${category.replace("-", " ")}`,
        tags: onSale ? ["Deal"] : [],
        featured: seeded(seed + "f") < 0.14,
      });
    }
  }

  for (let i = 0; i < values.length; i += 40) {
    await db.insert(schema.products).values(values.slice(i, i + 40));
  }

  const [{ total }] = await db.select({ total: raw`count(*)`.mapWith(Number) }).from(schema.products);
  const [{ withImg }] = await db.select({ withImg: raw`count(*) filter (where image_avif is not null)`.mapWith(Number) }).from(schema.products);

  console.log(`\nkept (wellness + genetics, authored labels): ${kept[0].n}`);
  console.log(`created from photographs:                   ${values.length}`);
  console.log(`total products:                             ${total}`);
  console.log(`with a photograph:                          ${withImg}`);

  const byCat = await db.select({
    cat: schema.categories.name, n: raw`count(*)`.mapWith(Number),
    img: raw`count(*) filter (where ${schema.products.imageAvif} is not null)`.mapWith(Number),
  }).from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .groupBy(schema.categories.id, schema.categories.name, schema.categories.sortOrder)
    .orderBy(schema.categories.sortOrder);

  console.log("\ncategory        products  with photo");
  for (const r of byCat) console.log(`${r.cat.padEnd(15)} ${String(r.n).padStart(6)} ${String(r.img).padStart(10)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
