import { config } from "dotenv";
config({ path: ".env.local" });

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql, inArray } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Sample reviews, so the review surfaces can be seen working.

   Every row this writes is marked seeded = true. That flag is not decoration:

     - lib/seo.js excludes seeded rows from AggregateRating, so no invented
       score is ever published to a search engine. As real reviews arrive the
       markup starts shipping on its own, truthfully.
     - the admin marks these rows "sample" so nobody mistakes them for customers.
     - `npm run reviews:clear` removes exactly these and nothing else.

   Worth saying plainly: these are written, not collected. Under the FTC's 2024
   rule on consumer reviews, publishing fabricated reviews of real businesses is
   a civil-penalty matter. That is a launch question, not a demo one — but it is
   the reason the flag exists and the reason the schema stays gated. */

const HANDLES = [
  "greenroom_tj", "canna_curious", "lo.sanchez", "midcitymike", "terpsnotthc",
  "bakerst_413", "quietstoner", "dosed_daily", "hazel.b", "nocturnal_nate",
  "sunsetsmoker", "the_weekender", "rosinrachel", "onegramwonder", "cloudchaser88",
  "verified_vee", "dabsandnaps", "practical_pot", "eastsideeddie", "microdose_mo",
];

const PLACES = [
  "Los Angeles, CA", "Long Beach, CA", "Pasadena, CA", "Santa Monica, CA",
  "Oakland, CA", "San Diego, CA", "Sacramento, CA", "Culver City, CA",
  null, null, // plenty of people leave it blank
];

/* Copy pools, written per category so a vape review does not read like a
   flower review. Each entry is [title|null, body|null, ratingFloor]. A null
   body is a rating with no words, which is what most people actually leave. */
const BY_CATEGORY = {
  flower: [
    [null, null, 4],
    ["Smells better than it tests", "Bought this on the terpene numbers rather than the THC and it was the right call. Grinds soft, burns clean, no harshness at the end of the joint.", 5],
    [null, "Dense buds, properly cured. Jar smelled right the moment it opened.", 5],
    ["Fine, not remarkable", "Perfectly decent smoke but nothing I would go out of my way for again at this price. Dry-ish by the time it reached me.", 3],
    [null, null, 5],
    ["Too dry", "Arrived crumbly and the flavour was mostly gone. Might have been sitting a while. The delivery itself was quick.", 2],
    [null, "Second time ordering this. Consistent both times, which is the part I actually care about.", 5],
    ["Good daytime option", "Light enough that I can still get things done. Not couch-locking at all.", 4],
  ],
  "pre-rolls": [
    [null, null, 4],
    ["Rolled well", "No canoeing, no runs, burned evenly the whole way down. That is genuinely rare in a pack this cheap.", 5],
    [null, "Convenient and consistent. Good for taking somewhere rather than the main event.", 4],
    ["One was packed loose", "Four out of five were fine. The fifth burned twice as fast. Still decent value.", 3],
    [null, null, 5],
    ["Stronger than expected", "The infused ones are not a gimmick. Half is plenty if you are not used to them.", 5],
  ],
  vape: [
    [null, null, 5],
    ["No clogging", "Three weeks in and the airflow is still fine, which is more than I can say for the last two carts I bought.", 5],
    [null, "Flavour holds up to the last of it. Battery threading was fine.", 4],
    ["Leaked in my pocket", "Worked well until it did not. Oil around the mouthpiece by day four. Support sorted it but worth knowing.", 2],
    [null, null, 4],
    ["Good for discretion", "Barely any smell, which is the whole reason I switched from flower on weeknights.", 5],
    [null, "Hits smooth, no burnt taste even at the end.", 4],
  ],
  concentrates: [
    [null, null, 5],
    ["Proper cold cure", "Consistency is right, no chasing it around the banger. You can taste that it was not rushed.", 5],
    [null, "Strong, clean, and the jar was full to the line. No complaints.", 5],
    ["Fine but pricey", "Quality is there. I just cannot justify it every week.", 4],
    [null, null, 4],
  ],
  edibles: [
    [null, null, 5],
    ["Consistent dosing", "Cut them in half the first time as advised and the second half was identical. That consistency is the whole reason I buy these.", 5],
    [null, "Onset was about an hour for me. Lasted most of the evening without the heavy morning after.", 4],
    ["Too sweet", "They work, they are just sugary enough that I would not eat two.", 3],
    [null, null, 4],
    ["Actually helped me sleep", "The CBN ones do something the regular ones do not. Not a placebo as far as I can tell.", 5],
    [null, "Tastes like a sweet rather than like cannabis, which was the point.", 5],
  ],
  beverages: [
    [null, null, 4],
    ["Fast onset", "Comes on much quicker than a gummy — twenty minutes rather than an hour. Useful if you are timing an evening.", 5],
    [null, "Tastes fine cold. Would not drink it warm.", 4],
    ["Weaker than the label suggests", "Might just be my tolerance but I needed two, which makes it expensive.", 3],
  ],
  wellness: [
    [null, null, 4],
    ["Does what it says", "Using it for shoulder pain rather than to get high. No head effect at all at this ratio.", 5],
    [null, "Dropper is accurate, which sounds trivial until you have used one that is not.", 4],
  ],
  gear: [
    [null, null, 5],
    ["Sturdy", "Feels like it will last. Better made than the price suggested.", 5],
    [null, "Exactly what was pictured. Arrived quick.", 4],
    ["Fine, does the job", "Nothing special but nothing wrong with it either.", 3],
  ],
  genetics: [
    [null, null, 4],
    [null, "Germination rate was good — eight of ten. Packaging was discreet.", 5],
  ],
};

const SHOP_REVIEWS = [
  [null, null, 5],
  ["Driver was early", "Quoted 45–90 minutes, arrived in 35. Texted ahead, checked ID at the door without making it awkward.", 5],
  [null, "Third order with them. Never once been late.", 5],
  ["Menu was out of date", "Two things in my basket turned out to be unavailable and they called to swap them. Handled well, but I would rather the menu were right.", 3],
  [null, null, 4],
  ["Good with substitutions", "They rang before swapping anything rather than just deciding for me. Small thing, makes a difference.", 5],
  ["Minimum is steep", "Service is fine, the fifty dollar minimum is the reason I do not order more often.", 3],
  [null, "Arrived exactly in the window. Nothing to complain about.", 4],
  [null, null, 5],
  ["Cash only was a surprise", "Card reader was down and I had to find an ATM while the driver waited. Worth checking before you order.", 2],
];

// Deterministic pseudo-randomness: same catalogue in, same reviews out.
function seeded(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const pick = (arr, s) => arr[Math.floor(seeded(s) * arr.length) % arr.length];
const between = (lo, hi, s) => Math.round(lo + seeded(s) * (hi - lo));

async function main() {
  const clear = process.argv.includes("--clear");

  if (clear) {
    const gone = await db.delete(schema.reviews)
      .where(eq(schema.reviews.seeded, true))
      .returning({ id: schema.reviews.id });
    console.log(`removed ${gone.length} seeded review(s). Reviews written by people are untouched.`);
    return;
  }

  const existing = await db
    .select({ n: sql`count(*)`.mapWith(Number) })
    .from(schema.reviews)
    .where(eq(schema.reviews.seeded, true));
  if (existing[0].n > 0) {
    console.log(`${existing[0].n} seeded review(s) already present. Run with --clear first to reseed.`);
    return;
  }

  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      category: schema.categories.slug,
    })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id));

  const shops = await db.select({ id: schema.shops.id, name: schema.shops.name }).from(schema.shops);

  const rows = [];
  const now = Date.now();

  for (const p of products) {
    const pool = BY_CATEGORY[p.category] ?? BY_CATEGORY.gear;
    // Not every product gets reviews. A shelf where everything has exactly
    // four is obviously generated.
    const n = between(0, 6, `${p.id}|count`);
    for (let i = 0; i < n; i++) {
      const key = `${p.id}|${i}`;
      const [title, body, floor] = pick(pool, key);
      rows.push({
        productId: p.id,
        rating: Math.min(5, floor + (seeded(key + "r") < 0.25 ? 0 : 0)),
        title,
        body,
        authorHandle: pick(HANDLES, key + "h"),
        authorLocation: pick(PLACES, key + "l"),
        status: "published",
        seeded: true,
        moderatedBy: "seed",
        moderatedAt: new Date(),
        createdAt: new Date(now - between(1, 240, key + "d") * 86400000),
      });
    }
  }

  for (const s of shops) {
    const n = between(3, 11, `${s.id}|scount`);
    for (let i = 0; i < n; i++) {
      const key = `s${s.id}|${i}`;
      const [title, body, floor] = pick(SHOP_REVIEWS, key);
      rows.push({
        shopId: s.id,
        rating: floor,
        title,
        body,
        authorHandle: pick(HANDLES, key + "h"),
        authorLocation: pick(PLACES, key + "l"),
        status: "published",
        seeded: true,
        moderatedBy: "seed",
        moderatedAt: new Date(),
        createdAt: new Date(now - between(1, 300, key + "d") * 86400000),
      });
    }
  }

  // A handful left pending, so the moderation queue has something in it.
  const sample = products.slice(0, 6);
  for (const p of sample) {
    const key = `pending|${p.id}`;
    const pool = BY_CATEGORY[p.category] ?? BY_CATEGORY.gear;
    const [title, body, floor] = pick(pool, key);
    rows.push({
      productId: p.id,
      rating: floor,
      title,
      body,
      authorHandle: pick(HANDLES, key + "h"),
      authorLocation: pick(PLACES, key + "l"),
      status: "pending",
      seeded: true,
      createdAt: new Date(now - between(1, 3, key + "d") * 3600000),
    });
  }

  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(schema.reviews).values(rows.slice(i, i + 200));
  }

  const published = rows.filter((r) => r.status === "published").length;
  const withText = rows.filter((r) => r.status === "published" && r.body).length;
  console.log(`inserted ${rows.length} sample review(s)`);
  console.log(`  ${published} published — ${withText} with text, ${published - withText} rating-only`);
  console.log(`  ${rows.length - published} left pending, so the moderation queue is not empty`);
  console.log(`\nEvery row is marked seeded = true:`);
  console.log(`  · excluded from AggregateRating, so nothing invented reaches a search engine`);
  console.log(`  · labelled "sample" in the admin`);
  console.log(`  · removable with: npm run reviews:clear`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
