import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/* Import the client's product photography into the app.

   Source images are already AVIF and well compressed, so this does not
   re-encode them larger — it normalises the name, caps the long edge at 900px
   (twice the biggest slot the UI uses), and writes a WebP alongside for the
   browsers that still lack AVIF. Output goes to /public/products/<category>/,
   which the app serves directly; ASSET_BASE_URL in the app can later point the
   same paths at a CDN without touching a single component. */

const SOURCE = "C:/Users/HP x360 1030 G2/Downloads/weedmaps";
const OUT = path.join(process.cwd(), "public", "products");

// Their folder names → our category slugs. "home" is site imagery, not a product.
const FOLDER_TO_CATEGORY = {
  flowers: "flower",
  prerolls: "pre-rolls",
  "infused prerolls": "pre-rolls",
  vapes: "vape",
  concerntrates: "concentrates",
  edible: "edibles",
  drinks: "beverages",
  accessories: "gear",
  home: "_site",
};

const slugify = (s) =>
  s.toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\d{9,}-/, "")          // strip the CDN timestamp prefix
    .replace(/^\d{9,}-/, "")          // some have two
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "image";

/* Placeholder art from the source CDN — a grey "image missing" tile. Importing
   these would put a broken-looking graphic on real products. */
const isPlaceholder = (name) => /image_missing|_missing|placeholder/i.test(name);

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Source folder not found: ${SOURCE}`);
    process.exit(1);
  }
  fs.rmSync(OUT, { recursive: true, force: true });

  const manifest = {};
  let imported = 0, skipped = 0, failed = 0;

  for (const folder of fs.readdirSync(SOURCE)) {
    const abs = path.join(SOURCE, folder);
    if (!fs.statSync(abs).isDirectory()) continue;

    const category = FOLDER_TO_CATEGORY[folder];
    if (!category) { console.log(`  ? unmapped folder, skipping: ${folder}`); continue; }

    const dir = path.join(OUT, category);
    fs.mkdirSync(dir, { recursive: true });
    manifest[category] ??= [];

    for (const file of fs.readdirSync(abs)) {
      if (!/\.(avif|webp|png|jpe?g)$/i.test(file)) continue;
      if (isPlaceholder(file)) { skipped++; continue; }

      const slug = slugify(file);
      let name = slug, n = 2;
      while (manifest[category].some((m) => m.slug === name)) name = `${slug}-${n++}`;

      try {
        const src = path.join(abs, file);
        const img = sharp(src, { failOn: "none" });
        const meta = await img.metadata();

        // Skip anything too small to be a product shot.
        if ((meta.width ?? 0) < 200 || (meta.height ?? 0) < 200) { skipped++; continue; }

        const pipeline = sharp(src, { failOn: "none" }).resize({
          width: 900, height: 900, fit: "inside", withoutEnlargement: true,
        });

        await pipeline.clone().avif({ quality: 62 }).toFile(path.join(dir, `${name}.avif`));
        await pipeline.clone().webp({ quality: 78 }).toFile(path.join(dir, `${name}.webp`));

        manifest[category].push({
          slug: name,
          avif: `/products/${category}/${name}.avif`,
          webp: `/products/${category}/${name}.webp`,
          // words from the filename, for matching against product names
          words: name.split("-").filter((w) => w.length > 2 && !/^\d+$/.test(w)),
          width: Math.min(meta.width ?? 900, 900),
          height: Math.min(meta.height ?? 900, 900),
          source: file,
        });
        imported++;
      } catch (err) {
        failed++;
        console.log(`  ! ${folder}/${file}: ${String(err.message).slice(0, 60)}`);
      }
    }
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log("\nimported:", imported, "| skipped:", skipped, "| failed:", failed);
  for (const [cat, items] of Object.entries(manifest)) {
    console.log(`  ${cat.padEnd(14)} ${items.length}`);
  }

  const bytes = Object.values(manifest).flat().reduce((n, m) => {
    const p = path.join(process.cwd(), "public", m.avif);
    return n + (fs.existsSync(p) ? fs.statSync(p).size : 0);
  }, 0);
  console.log(`\navif payload: ${(bytes / 1048576).toFixed(1)} MB in /public/products`);
}

main().catch((e) => { console.error(e); process.exit(1); });
