import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Attach photography to products.

   Two passes. First, match on the words in the filename against the product
   and brand name — many of the source files are named after the actual product
   ("live_resin_honey_banana", "bluedream-all-in-one"), so those land on the
   right item. Second, every remaining product in a category gets an unused
   image from that same category, so a flower product always shows flower.

   The second pass is category-accurate, not product-accurate: the photo shows
   that kind of product, not that exact SKU. The whole catalogue is already
   disclosed as demonstration data, and the footer disclosure names imagery
   explicitly, so this is labelled rather than implied. */

const STOP = new Set([
  "the", "and", "for", "with", "copy", "image", "final", "web", "png", "jpg",
  "squared", "icon", "logo", "product", "products", "new", "cru", "awards",
  "screenshot", "resized", "front", "back", "upright", "clear", "circle",
]);

const tokens = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));

function score(imageWords, productWords, brandWords) {
  const img = new Set(imageWords);
  let s = 0;
  for (const w of productWords) if (img.has(w)) s += 3;      // product name is the strong signal
  for (const w of brandWords) if (img.has(w)) s += 2;
  return s;
}

async function main() {
  const manifestPath = path.join(process.cwd(), "public", "products", "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error("No manifest — run `node scripts/import-images.mjs` first.");
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const rows = await db
    .select({
      id: schema.products.id, name: schema.products.name,
      category: schema.categories.slug, brand: schema.brands.name,
    })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .innerJoin(schema.brands, eq(schema.products.brandId, schema.brands.id));

  const used = new Set();
  const assignments = [];
  let named = 0, pooled = 0, none = 0;

  // pass 1 — name match
  for (const p of rows) {
    const pool = manifest[p.category] ?? [];
    if (!pool.length) continue;
    const pw = tokens(p.name), bw = tokens(p.brand);
    let best = null, bestScore = 0;
    for (const img of pool) {
      if (used.has(img.slug)) continue;
      const s = score(img.words, pw, bw);
      if (s > bestScore) { bestScore = s; best = img; }
    }
    if (best && bestScore >= 3) {
      used.add(best.slug);
      assignments.push({ p, img: best, how: "name" });
      named++;
    }
  }

  // pass 2 — category pool for whatever is left
  const assigned = new Set(assignments.map((a) => a.p.id));
  for (const p of rows) {
    if (assigned.has(p.id)) continue;
    const pool = (manifest[p.category] ?? []).filter((i) => !used.has(i.slug));
    if (!pool.length) {
      // category exhausted or has no photography at all (wellness, genetics)
      const all = manifest[p.category] ?? [];
      if (!all.length) { none++; continue; }
      const reuse = all[p.id % all.length];
      assignments.push({ p, img: reuse, how: "reused" });
      pooled++;
      continue;
    }
    const img = pool[0];
    used.add(img.slug);
    assignments.push({ p, img, how: "pool" });
    pooled++;
  }

  console.log("writing assignments…");
  for (const a of assignments) {
    await db.update(schema.products).set({
      imageAvif: a.img.avif,
      imageWebp: a.img.webp,
      imageAlt: `${a.p.brand} ${a.p.name} — ${a.p.category.replace("-", " ")}`,
    }).where(eq(schema.products.id, a.p.id));
  }

  console.log(`\nproducts             ${rows.length}`);
  console.log(`  matched by name    ${named}`);
  console.log(`  category pool      ${pooled}`);
  console.log(`  no photography     ${none}  (keep the authored label)`);
  console.log(`\nimages used          ${used.size} of ${Object.values(manifest).flat().length}`);

  console.log("\nsample name matches:");
  assignments.filter((a) => a.how === "name").slice(0, 8).forEach((a) =>
    console.log(`  ${a.p.name.padEnd(30)} <- ${a.img.slug}`));
}

main().catch((e) => { console.error(e); process.exit(1); });
