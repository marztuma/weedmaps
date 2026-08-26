import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
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

/* Import the Brands folder.

   It holds two different things, so it is sorted by shape rather than by
   filename: anything wider than about 2.2:1 is a page banner, anything roughly
   square is a logo. Two banners name their brand in the filename (STIIIZY,
   Select) and are attached to those brands; the rest are generic Weedmaps
   banners kept as a shared default for brand pages that have none of their own.

   Only art that can be attributed to a brand is attached to one. Nothing is
   guessed onto a brand it does not belong to. */

const SOURCE = "C:/Users/HP x360 1030 G2/Downloads/weedmaps/Brands";
const OUT = path.join(process.cwd(), "public", "brands");

const slugify = (s) =>
  s.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/^\d{9,}-/g, "")
    .replace(/[+_\s]+/g, "-").replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "art";

/* Brands named inside a filename. Matched on whole words so a short token
   cannot collide with a hex fragment. */
const NAMED = [
  ["stiiizy", "STIIIZY"],
  ["select", "Select"],
  ["revert", "Revert"],
  ["ruby-farms", "Ruby Farms"],
  ["rythm", "Rythm"],
];

function nameFor(slug) {
  for (const [needle, brand] of NAMED) if (slug.includes(needle)) return brand;
  return null;
}

async function main() {
  if (!fs.existsSync(SOURCE)) { console.error(`Not found: ${SOURCE}`); process.exit(1); }
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, "banners"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "logos"), { recursive: true });

  const banners = [], logos = [];
  const seen = new Set();

  for (const file of fs.readdirSync(SOURCE)) {
    if (!/\.(avif|webp|png|jpe?g|jfif)$/i.test(file)) continue;
    const src = path.join(SOURCE, file);

    let meta;
    try { meta = await sharp(src, { failOn: "none" }).metadata(); }
    catch { console.log(`  ! unreadable: ${file}`); continue; }

    const ratio = meta.width / meta.height;
    const isBanner = ratio > 2.2;
    const kind = isBanner ? "banners" : "logos";

    let slug = slugify(file);
    // the folder contains exact duplicates; keep one of each
    if (seen.has(slug)) { console.log(`  · duplicate skipped: ${file}`); continue; }
    seen.add(slug);

    const pipeline = sharp(src, { failOn: "none" }).resize({
      width: isBanner ? 1800 : 480,
      height: isBanner ? 560 : 480,
      fit: "inside",
      withoutEnlargement: true,
    });

    const dir = path.join(OUT, kind);
    await pipeline.clone().avif({ quality: 62 }).toFile(path.join(dir, `${slug}.avif`));
    await pipeline.clone().webp({ quality: 80 }).toFile(path.join(dir, `${slug}.webp`));

    const entry = {
      slug,
      avif: `/brands/${kind}/${slug}.avif`,
      webp: `/brands/${kind}/${slug}.webp`,
      brand: nameFor(slug),
      width: meta.width,
      height: meta.height,
    };
    (isBanner ? banners : logos).push(entry);
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ banners, logos }, null, 2));

  console.log(`banners: ${banners.length}   logos: ${logos.length}`);

  // attach whatever can be attributed
  const brandRows = await db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands);
  const byName = new Map(brandRows.map((b) => [b.name.toLowerCase(), b]));

  let attachedB = 0, attachedL = 0, created = 0;

  const ensure = async (name) => {
    const hit = byName.get(name.toLowerCase());
    if (hit) return hit.id;
    const [row] = await db.insert(schema.brands)
      .values({ slug: slugify(name), name, kind: null, featured: false })
      .returning({ id: schema.brands.id });
    byName.set(name.toLowerCase(), { id: row.id, name });
    created++;
    console.log(`  + brand: ${name}`);
    return row.id;
  };

  for (const b of banners) {
    if (!b.brand) continue;
    const id = await ensure(b.brand);
    await db.update(schema.brands)
      .set({ bannerAvif: b.avif, bannerWebp: b.webp })
      .where(eq(schema.brands.id, id));
    attachedB++;
    console.log(`  banner → ${b.brand}`);
  }

  for (const l of logos) {
    if (!l.brand) continue;
    const id = await ensure(l.brand);
    await db.update(schema.brands)
      .set({ logoAvif: l.avif, logoWebp: l.webp })
      .where(eq(schema.brands.id, id));
    attachedL++;
    console.log(`  logo   → ${l.brand}`);
  }

  const generic = banners.filter((b) => !b.brand);
  const orphanLogos = logos.filter((l) => !l.brand);

  const [{ withBanner, withLogo, total }] = await db.select({
    withBanner: raw`count(*) filter (where banner_avif is not null)`.mapWith(Number),
    withLogo: raw`count(*) filter (where logo_avif is not null)`.mapWith(Number),
    total: raw`count(*)`.mapWith(Number),
  }).from(schema.brands);

  console.log(`\nbrands created      : ${created}`);
  console.log(`banners attached    : ${attachedB}`);
  console.log(`logos attached      : ${attachedL}`);
  console.log(`brands with banner  : ${withBanner} of ${total}`);
  console.log(`brands with logo    : ${withLogo} of ${total}`);
  console.log(`\nunattributed banners: ${generic.length} — kept as the shared default banner`);
  console.log(`unattributed logos  : ${orphanLogos.length} — left in the library, attached to nothing`);
  if (generic.length) console.log(`default banner      : ${generic[0].avif}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
