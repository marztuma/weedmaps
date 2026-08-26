import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql as raw, isNotNull } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Move the product photography to Cloudinary and point the database at it.

   Safe to run repeatedly. A local ledger records what has already been uploaded,
   and Cloudinary is asked to overwrite nothing, so an interrupted run resumes
   instead of duplicating. Only the 900px AVIF is uploaded — Cloudinary derives
   every other size and format on delivery, so uploading a WebP twin would pay
   for storage twice for no benefit.

   Nothing is deleted from /public. Until you have verified the CDN is serving,
   the local copies remain the fallback, and any product that fails to upload
   simply keeps serving locally. */

const LEDGER = path.join(process.cwd(), "public", "products", "cloudinary.json");
// Everything lives under one top-level folder so this project is separable from
// anything else in the same Cloudinary account. Category subfolders mirror the
// local layout, which keeps the two stores legible side by side.
const FOLDER = process.env.CLOUDINARY_FOLDER || "weedmaps";

function requireConfig() {
  const missing = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("Cloudinary is not configured. Add these to .env.local:\n");
    console.error("  CLOUDINARY_CLOUD_NAME=your-cloud-name");
    console.error("  CLOUDINARY_API_KEY=...");
    console.error("  CLOUDINARY_API_SECRET=...");
    console.error("  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name   # same value, needed in the browser\n");
    console.error(`Missing: ${missing.join(", ")}`);
    console.error("\nFind them on the Cloudinary dashboard. Never commit .env.local.");
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const readLedger = () => {
  try { return JSON.parse(fs.readFileSync(LEDGER, "utf8")); } catch { return {}; }
};
const writeLedger = (l) => fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2));

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!dryRun) requireConfig();

  const rows = await db.select({
    id: schema.products.id,
    name: schema.products.name,
    avif: schema.products.imageAvif,
    cloudId: schema.products.imageCloudId,
  }).from(schema.products).where(isNotNull(schema.products.imageAvif));

  // one upload per distinct file — many products share a photograph
  const byFile = new Map();
  for (const r of rows) {
    if (!byFile.has(r.avif)) byFile.set(r.avif, []);
    byFile.get(r.avif).push(r);
  }

  const ledger = readLedger();
  const files = [...byFile.keys()];
  const todo = files.filter((f) => !ledger[f]);

  console.log(`products with a photograph : ${rows.length}`);
  console.log(`distinct image files       : ${files.length}`);
  console.log(`already uploaded           : ${files.length - todo.length}`);
  console.log(`to upload this run         : ${todo.length}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing uploaded. Add credentials and re-run without the flag.");
    return;
  }
  if (!todo.length) {
    console.log("\nNothing new to upload.");
  }

  let ok = 0, failed = 0;
  for (const [i, file] of todo.entries()) {
    const abs = path.join(process.cwd(), "public", file);
    if (!fs.existsSync(abs)) { failed++; console.log(`  ! missing on disk: ${file}`); continue; }

    // public id mirrors the local path so the two stores stay legible together
    const publicId = `${FOLDER}/${file.replace(/^\/products\//, "").replace(/\.avif$/, "")}`;

    try {
      const res = await cloudinary.uploader.upload(abs, {
        public_id: publicId,
        overwrite: false,
        unique_filename: false,
        resource_type: "image",
        // let Cloudinary keep a high-quality master; delivery sizes are derived
        transformation: [{ quality: "auto:good" }],
      });
      ledger[file] = { publicId: res.public_id, bytes: res.bytes, width: res.width, height: res.height };
      ok++;
      if ((i + 1) % 20 === 0 || i === todo.length - 1) {
        writeLedger(ledger);
        console.log(`  uploaded ${ok}/${todo.length}…`);
      }
    } catch (err) {
      failed++;
      console.log(`  ! ${file}: ${String(err?.message ?? err).slice(0, 90)}`);
    }
  }
  writeLedger(ledger);

  console.log("\npointing the database at Cloudinary…");
  let updated = 0;
  for (const [file, products] of byFile) {
    const entry = ledger[file];
    if (!entry) continue;
    for (const p of products) {
      if (p.cloudId === entry.publicId) continue;
      await db.update(schema.products)
        .set({ imageCloudId: entry.publicId })
        .where(eq(schema.products.id, p.id));
      updated++;
    }
  }

  const [{ onCloud, total }] = await db.select({
    onCloud: raw`count(*) filter (where image_cloud_id is not null)`.mapWith(Number),
    total: raw`count(*) filter (where image_avif is not null)`.mapWith(Number),
  }).from(schema.products);

  console.log(`\nuploaded ok        : ${ok}`);
  console.log(`failed             : ${failed}`);
  console.log(`products repointed : ${updated}`);
  console.log(`now on Cloudinary  : ${onCloud} of ${total}`);

  if (failed) {
    console.log("\nFailed files keep serving from /public — re-run to retry just those.");
  }
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.log("\nNEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set, so the app will keep");
    console.log("serving local files. Set it to the same cloud name and rebuild.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
