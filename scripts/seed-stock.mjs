import { config } from "dotenv";
config({ path: ".env.local" });

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, isNull } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Give the catalogue stock levels.

   Deliberately uneven. A shelf where everything holds 40 units tells you
   nothing and makes the low-stock alert meaningless — the whole point of the
   number is that some of them are nearly out. So roughly one product in
   fourteen is out entirely, one in eight is under its threshold, and a slice
   is left untracked to prove null is handled everywhere rather than assumed
   away.

   Thresholds vary by category because "low" does: five eighths of flower is
   nearly gone, five batteries is a normal shelf. */

const LOW_AT = {
  flower: 6, "pre-rolls": 10, vape: 8, concentrates: 5,
  edibles: 12, beverages: 12, wellness: 5, gear: 3, genetics: 3,
};

const TYPICAL = {
  flower: [8, 90], "pre-rolls": [12, 140], vape: [10, 120], concentrates: [4, 45],
  edibles: [15, 180], beverages: [10, 120], wellness: [5, 50], gear: [2, 30], genetics: [2, 20],
};

function seeded(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const between = (lo, hi, s) => Math.round(lo + seeded(s) * (hi - lo));

async function main() {
  if (process.argv.includes("--clear")) {
    await db.update(schema.products).set({ stockQty: null });
    console.log("stock cleared — every product is untracked again.");
    return;
  }

  const rows = await db
    .select({ id: schema.products.id, name: schema.products.name, cat: schema.categories.slug })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id));

  let out = 0, low = 0, untracked = 0, healthy = 0;

  for (const p of rows) {
    const key = `${p.id}|stock`;
    const roll = seeded(key);
    const lowAt = LOW_AT[p.cat] ?? 5;
    const [lo, hi] = TYPICAL[p.cat] ?? [5, 50];

    let qty;
    if (roll < 0.05) { qty = null; untracked++; }            // made to order / not counted
    else if (roll < 0.12) { qty = 0; out++; }                 // sold out
    else if (roll < 0.24) { qty = between(1, lowAt, key + "l"); low++; }
    else { qty = between(lowAt + 1, hi, key + "h"); healthy++; }

    await db.update(schema.products)
      .set({ stockQty: qty, lowStockAt: lowAt })
      .where(eq(schema.products.id, p.id));
  }

  console.log(`stocked ${rows.length} products`);
  console.log(`  ${healthy} healthy`);
  console.log(`  ${low} at or below their threshold`);
  console.log(`  ${out} out of stock`);
  console.log(`  ${untracked} left untracked (null), which must never read as zero`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
