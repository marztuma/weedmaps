import { config } from "dotenv";
config({ path: ".env.local" });

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

/* Original product copy, composed from each product's own attributes.

   Nothing here is lifted from another retailer. Each description is assembled
   from what is actually true of the row — its form, its measured potency, its
   strain class, its size — plus practical guidance a buyer needs (onset time
   for edibles, hardware compatibility for carts, the fact that topicals are not
   intoxicating). Sentence shapes vary by a seed derived from the product name
   so the catalogue does not read as one template repeated 197 times.

   Where a claim would be unverifiable — lab results, awards, sourcing — the
   copy says nothing rather than inventing it. */

function seeded(s, salt = "") {
  let h = 2166136261;
  const str = s + salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const pick = (arr, s, salt) => arr[Math.floor(seeded(s, salt) * arr.length) % arr.length];

/* Flavour cues taken from words that actually appear in the product name. */
const FLAVOR_WORDS = {
  lemon: "citrus", lime: "citrus", citrus: "citrus", orange: "citrus", tangerine: "citrus",
  grapefruit: "citrus", yuzu: "citrus", cherry: "dark berry", berry: "dark berry",
  blackberry: "dark berry", blueberry: "dark berry", raspberry: "dark berry",
  boysenberry: "dark berry", huckleberry: "dark berry", marionberry: "dark berry",
  grape: "dark berry", strawberry: "red fruit", apple: "orchard fruit",
  peach: "orchard fruit", pear: "orchard fruit", papaya: "tropical", mango: "tropical",
  pineapple: "tropical", banana: "tropical", melon: "melon", watermelon: "melon",
  honeydew: "melon", gelato: "sweet cream", cream: "sweet cream", milk: "sweet cream",
  cake: "vanilla and batter", cookie: "baked sugar", churro: "cinnamon sugar",
  chocolate: "cocoa", mint: "cool mint", menthe: "cool mint", lavender: "floral",
  rosemary: "herbal", cardamom: "warm spice", ginger: "warm spice", garlic: "savoury funk",
  cheese: "savoury funk", gas: "fuel", diesel: "fuel", kush: "earthy pine",
  og: "earthy pine", haze: "bright pine", jack: "bright pine", punch: "sweet fruit",
  sherbet: "sweet cream", zest: "citrus", soda: "sweet fizz", matcha: "green tea",
};

const EFFECTS = {
  Indica: ["Relaxed", "Sleepy", "Body-heavy", "Calm", "Hungry"],
  Sativa: ["Energetic", "Focused", "Uplifted", "Talkative", "Creative"],
  Hybrid: ["Balanced", "Relaxed", "Uplifted", "Happy", "Creative"],
  Topical: ["Localised relief", "Non-intoxicating"],
  Accessory: [],
};

function flavors(name) {
  const words = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ");
  const found = [];
  for (const w of words) {
    const f = FLAVOR_WORDS[w];
    if (f && !found.includes(f)) found.push(f);
  }
  return found.slice(0, 3);
}

function effectsFor(strain, seed) {
  const pool = EFFECTS[strain] ?? EFFECTS.Hybrid;
  if (!pool.length) return [];
  const n = 2 + Math.floor(seeded(seed, "en") * 2);
  const out = [];
  for (let i = 0; out.length < Math.min(n, pool.length) && i < 12; i++) {
    const c = pick(pool, seed, "e" + i);
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

const strainLine = (strain, seed) => ({
  Indica: [
    "An indica-dominant pick, so expect it to settle rather than lift.",
    "Indica-leaning — better suited to an evening than a working afternoon.",
    "Indica classification, which usually means weight in the body before anything else.",
  ],
  Sativa: [
    "A sativa-dominant pick, so expect lift rather than weight.",
    "Sativa-leaning — daytime company rather than a nightcap.",
    "Sativa classification, which tends to arrive in the head first.",
  ],
  Hybrid: [
    "A hybrid, which is why it reads more even than either extreme.",
    "Hybrid classification — neither strictly a daytime nor an evening pick.",
    "A hybrid, so it sits between the two poles rather than committing.",
  ],
}[strain]?.[Math.floor(seeded(seed, "sl") * 3)] ?? "");

function potencyLine(category, thc, seed) {
  const n = Number(thc);
  if (!n) return "";
  if (category === "edibles" || category === "beverages") {
    return `Dosed at ${n}mg per serving. Onset runs 45 to 90 minutes — start with half and wait the full hour and a half before deciding you need more.`;
  }
  if (category === "concentrates") {
    return n >= 80
      ? `Tested at ${n}% THC. That is concentrate territory: a rice-grain portion is a full dose.`
      : `Tested at ${n}% THC, which is moderate for an extract but still several times the strength of flower.`;
  }
  if (category === "vape") {
    return `Tested at ${n}% THC. One or two short draws is a dose; the oil does not need a hard pull.`;
  }
  if (n >= 28) return `Tested at ${n}% THC, which is at the strong end of the shelf.`;
  if (n >= 20) return `Tested at ${n}% THC — mid-to-high, and unremarkable for a modern shelf.`;
  return `Tested at ${n}% THC, which is gentler than most of what sits beside it.`;
}

function formLine(category, sub, weight, seed) {
  const s = (sub ?? "").toLowerCase();

  if (category === "flower") {
    if (s.includes("smalls")) return `Smalls: the same cure, smaller buds, priced below the jar. Sold as ${weight}.`;
    if (s.includes("shake")) return `Ground and ready to roll, sold as ${weight} — the cheapest way to fill papers.`;
    if (s.includes("infused")) return `Infused flower, sold as ${weight}. Coated and dusted, so it burns slower and hits harder than the same strain plain.`;
    if (s.includes("big")) return `Sold as ${weight} of big buds — fewer, larger flowers rather than a jar of mixed sizes.`;
    return `Cured whole bud, sold as ${weight}.`;
  }
  if (category === "pre-rolls") {
    if (s.includes("infused")) return `An infused pre-roll at ${weight} — flower with concentrate worked through it, so it runs stronger and longer than a plain joint.`;
    if (s.includes("blunt")) return `Rolled as a blunt at ${weight}. Slower burning and heavier than a paper joint.`;
    if (s.includes("multi") || weight.includes("×")) return `A pack of ${weight} — rolled, packed and ready, which is the point of buying them by the box.`;
    return `A single pre-roll at ${weight}. Nothing to grind, nothing to roll.`;
  }
  if (category === "vape") {
    if (s.includes("batter")) return `Hardware, not oil. Fits standard 510-thread cartridges.`;
    if (s.includes("dispos")) return `An all-in-one at ${weight} — battery and oil in one body, used until it is empty and then recycled.`;
    if (s.includes("pod")) return `A ${weight} pod, which only fits its own brand's battery. Check you own the right one before buying.`;
    if (s.includes("live resin")) return `A ${weight} live resin cartridge — extracted from fresh-frozen plant, which is why it keeps more of the strain's smell than distillate does.`;
    return `A ${weight} 510-thread cartridge, so it fits any standard battery.`;
  }
  if (category === "concentrates") {
    if (s.includes("rosin")) return `Solventless rosin at ${weight} — pressed with heat and pressure, no solvent involved at any stage.`;
    if (s.includes("diamond")) return `Diamonds at ${weight}: crystalline THCA, usually served in its own terpene sauce.`;
    if (s.includes("badder")) return `Badder at ${weight} — whipped to a soft, scoopable consistency that behaves on a dab tool.`;
    if (s.includes("hash")) return `Ice water hash at ${weight}, washed rather than extracted with solvent.`;
    if (s.includes("rso")) return `RSO at ${weight} — a full-extract oil, taken orally or added to food rather than dabbed.`;
    return `A ${weight} extract, sold by the gram.`;
  }
  if (category === "edibles") {
    if (s.includes("chocolate")) return `A ${weight} bar, scored into pieces so a dose is a piece rather than a guess.`;
    if (s.includes("mint")) return `${weight} of mints — small, discreet, and easy to under-dose deliberately.`;
    return `Sold as ${weight}, portioned so one piece is one dose.`;
  }
  if (category === "beverages") {
    return `Sold as ${weight}. Drinks come up faster than a gummy — usually fifteen to thirty minutes — because there is nothing to digest.`;
  }
  if (category === "gear") {
    return `Hardware. No cannabis, no potency, nothing to expire.`;
  }
  return `Sold as ${weight}.`;
}

function closingLine(category, brand, seed) {
  const options = [
    `Carried by ${brand}.`,
    `From ${brand}${/s$/i.test(brand) ? "'" : "'s"} current range.`,
    `${/^[aeiou]/i.test(brand) ? "An" : "A"} ${brand} line item.`,
  ];
  return pick(options, seed, "cl");
}

function compose(p) {
  const seed = `${p.brand}|${p.name}`;
  const parts = [];

  parts.push(formLine(p.category, p.sub, p.weight, seed));

  const strain = strainLine(p.strainType, seed);
  if (strain) parts.push(strain);

  const potency = potencyLine(p.category, p.thc, seed);
  if (potency) parts.push(potency);

  const f = flavors(p.name);
  if (f.length) {
    parts.push(
      f.length === 1
        ? `The nose leans ${f[0]}.`
        : `Reads ${f.slice(0, -1).join(", ")} and ${f[f.length - 1]}.`
    );
  }

  if (Number(p.cbd) >= 1) {
    parts.push(`Carries ${Number(p.cbd)}% CBD alongside the THC, which tends to round off the edges.`);
  }

  if (p.category === "gear") {
    parts.push("Ships with the order like anything else on the menu.");
  } else if (p.strainType === "Topical") {
    parts.push("Applied to skin. Topicals work where you put them and do not get you high.");
  }

  parts.push(closingLine(p.category, p.brand, seed));

  return parts.filter(Boolean).join(" ");
}

async function main() {
  const rows = await db.select({
    id: schema.products.id, name: schema.products.name, weight: schema.products.weight,
    thc: schema.products.thc, cbd: schema.products.cbd, strainType: schema.products.strainType,
    category: schema.categories.slug, sub: schema.subcategories.name, brand: schema.brands.name,
  })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .innerJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
    .leftJoin(schema.subcategories, eq(schema.products.subcategoryId, schema.subcategories.id));

  console.log(`writing copy for ${rows.length} products…`);

  for (const p of rows) {
    const description = compose(p);
    const seed = `${p.brand}|${p.name}`;
    await db.update(schema.products).set({
      description,
      effects: effectsFor(p.strainType, seed),
      flavors: flavors(p.name),
    }).where(eq(schema.products.id, p.id));
  }

  const [{ done, avg }] = await db.select({
    done: raw`count(*) filter (where description is not null)`.mapWith(Number),
    avg: raw`round(avg(length(description)))`.mapWith(Number),
  }).from(schema.products);

  console.log(`\nwith a description: ${done}`);
  console.log(`average length:     ${avg} characters`);

  console.log("\nsamples:\n");
  for (const p of rows.slice(0, 3)) {
    console.log(`  ${p.brand} — ${p.name}`);
    console.log(`  ${compose(p)}\n`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
