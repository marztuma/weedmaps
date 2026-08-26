import fs from "node:fs";
import path from "node:path";

/* Derive a product from each imported photograph.

   The source files came off Weedmaps' own CDN, so most filenames carry the real
   product name, and often the brand, weight, strain and form as well. Building
   the catalogue from the images — rather than matching invented names onto
   whatever photo was left — is what makes every product's picture actually be a
   picture of that product.

   Filenames that carry no information ("download-2", a bare UUID, "screenshot
   2025-01-23 at 6-58-09 pm") cannot name a product honestly. Those are reported
   as unnamed and given a form-based name from their category instead, which is
   true of the photo even when the specific SKU is unknowable. */

const MANIFEST = path.join(process.cwd(), "public", "products", "manifest.json");

/* Brands visible in the filenames, longest first so "silly nice" wins over "nice". */
const BRANDS = [
  ["cb rolling green", "CB Rolling Green"], ["rolling green", "Rolling Green"],
  ["silly nice", "Silly Nice"], ["mr nice guy", "Mr Nice Guy"], ["mrniceguy", "Mr Nice Guy"],
  ["incredibles", "Incredibles"], ["jetpacks", "Jetpacks"], ["goodlife", "Good Life"],
  ["hiistix", "Hii Stix"], ["dimebag", "Dimebag"], ["jaunty", "Jaunty"],
  ["kiva", "Kiva Confections"], ["grav", "GRAV"],
  ["rawtips", "RAW"], ["raw", "RAW"], ["olio", "Olio"], ["ayr", "AYR"],
  ["tune", "Tune"], ["palms", "Palms"], ["cru", "Cru"], ["nyh", "NYH"],
  ["mfny", "MFNY"], ["sour af", "Sour AF"], ["genericaf", "Generic AF"],
  ["hp", "House Plant"], ["fireball", "Fireball"], ["lobo", "Lobo"],
  ["ff", "Farmer's Friend"], ["mm", "MM"],
];

/* Form words → the subcategory they imply, per category. */
const FORMS = {
  concentrates: [
    ["live rosin", "Live rosin"], ["liveresin", "Live rosin"], ["live resin", "Live rosin"],
    ["bubble hash", "Ice water hash"], ["hash", "Ice water hash"], ["rosin", "Rosin"],
    ["diamonds", "Diamonds"], ["badder", "Badder & batter"], ["batter", "Badder & batter"],
    ["shatter", "Shatter"], ["sauce", "Sauce"], ["sugar", "Sugar"], ["crumble", "Crumble"],
    ["kief", "Kief"], ["rso", "RSO"],
  ],
  flower: [
    ["moonrocks", "Infused flower"], ["infused", "Infused flower"], ["smalls", "Smalls"],
    ["ground", "Shake & ground"], ["shake", "Shake & ground"], ["bud", "Whole bud"],
  ],
  "pre-rolls": [
    ["blunt", "Blunts"], ["infused", "Infused pre-rolls"], ["hash hole", "Hash holes"],
    ["pack", "Multi-packs"], ["mini", "Minis"], ["joint", "Singles"], ["preroll", "Singles"],
  ],
  vape: [
    ["disposable", "Disposables"], ["all in one", "Disposables"], ["all-in-one", "Disposables"],
    ["pod", "Pods"], ["battery", "Batteries"], ["live resin", "Live resin carts"],
    ["liveresin", "Live resin carts"], ["distillate", "Distillate carts"],
    ["cart", "Cartridges"], ["510", "Cartridges"], ["vape", "Cartridges"],
  ],
  edibles: [
    ["chocolate", "Chocolate"], ["gummie", "Gummies"], ["gummy", "Gummies"],
    ["gummies", "Gummies"], ["mint", "Mints"], ["belt", "Gummies"],
    ["caramel", "Caramels & chews"], ["chew", "Caramels & chews"], ["cookie", "Baked goods"],
    ["brownie", "Baked goods"], ["candy", "Hard candy"], ["tablet", "Tablets & capsules"],
  ],
  beverages: [
    ["seltzer", "Seltzers"], ["soda", "Sodas"], ["lemonade", "Tonics"], ["tonic", "Tonics"],
    ["shot", "Shots"], ["tea", "Teas"], ["stix", "Drink powders"], ["can", "Seltzers"],
  ],
  gear: [
    ["grinder", "Grinders"], ["paper", "Rolling papers"], ["tips", "Rolling papers"],
    ["bong", "Bongs & water pipes"], ["sherlock", "Hand pipes"], ["pipe", "Hand pipes"],
    ["bubbler", "Bubblers"], ["dab", "Dab rigs & tools"], ["vaporizer", "Vaporizers"],
    ["storage", "Storage"], ["tray", "Trays"], ["shirt", "Apparel"], ["logo", "Apparel"],
  ],
};

const STRAINS = [["indica", "Indica"], ["sativa", "Sativa"], ["hybrid", "Hybrid"]];

/* Noise: CDN ids, export artefacts, dimension suffixes, colour-profile tags. */
const NOISE = new RegExp(
  [
    "^\\d+$", "^[0-9a-f]{6,}$", "^download$", "^image$", "^images$", "^screenshot$",
    "^copy$", "^final$", "^web$", "^wen$", "^wb$", "^rgb$", "^jpg$", "^png$", "^jpeg$",
    "^\\d+x\\d+$", "^\\d{2}[wt]$", "^v\\d+$", "^upright\\d*$", "^product$", "^products$",
    "^squared$", "^icon$", "^clear$", "^circle$", "^flat$", "^colored$", "^background$",
    "^single$", "^resized$", "^at$", "^pm$", "^am$", "^untitled$", "^generic$",
  ].join("|")
);

// UUID shrapnel: 4ac5, 0d0d, b83c. Requires a digit so real words survive.
const HEXISH = /^(?=.*\d)[0-9a-f]{4,}$/;
const CATEGORY_WORDS = new Set([
  "concentrates", "concentrate", "edibles", "edible", "beverages", "drinks",
  "flower", "flowers", "vape", "vapes", "preroll", "prerolls", "gear",
  "accessories", "awards", "package", "jar", "bag", "tin", "carton", "onwhite",
]);
const isNoise = (w) => NOISE.test(w) || HEXISH.test(w) || CATEGORY_WORDS.has(w) || w.length < 2;

const TITLE_FIX = {
  og: "OG", thc: "THC", cbd: "CBD", cbn: "CBN", rso: "RSO", pbb: "Peanut Butter",
  af: "AF", nyc: "NYC", "510": "510", ny: "NY", mm: "MM", ff: "FF", hp: "HP",
};

const title = (words) =>
  words.map((w) => TITLE_FIX[w] ?? (w[0].toUpperCase() + w.slice(1))).join(" ");

/* Weight / dose from the filename: 1g, 3-5g, 100mg, 28g, 10mg. */
function extractWeight(slug, category) {
  const g = slug.match(/(\d+(?:-\d+)?)\s*g(?![a-z])/);
  const mg = slug.match(/(\d+)\s*mg/);
  if (mg) return `${mg[1]}mg`;
  if (g) return `${g[1].replace("-", ".")}g`;
  return { flower: "3.5g", "pre-rolls": "1g", vape: "1g", concentrates: "1g",
           edibles: "10 pk", beverages: "12 oz", gear: "1 unit" }[category] ?? "1g";
}

/* Substring matching is unsafe for short tokens: "ff" appears inside the hex of
   a UUID, "hp" inside "graphics". Anything under 4 characters must match a whole
   word. */
function detect(list, slug) {
  const words = slug.split(" ");
  for (const [needle, value] of list) {
    if (needle.length < 4 && !needle.includes(" ")) {
      if (words.includes(needle)) return value;
    } else if (slug.includes(needle)) {
      return value;
    }
  }
  return null;
}

export function derive(img, category) {
  const slug = img.slug.replace(/-/g, " ");
  const brand = detect(BRANDS, slug);
  const strain = detect(STRAINS, slug) ?? "Hybrid";
  const sub = detect(FORMS[category] ?? [], slug);
  const weight = extractWeight(img.slug, category);

  // Words left after stripping brand, strain, form, weights and noise.
  const brandWords = brand ? brand.toLowerCase().split(" ") : [];
  const brandCompact = brand ? brand.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
  const words = img.slug.split("-").filter((w) => {
    if (isNoise(w)) return false;
    if (brandWords.includes(w)) return false;
    if (brandCompact && w === brandCompact) return false;
    if (brandCompact && w.startsWith(brandCompact) && w.length - brandCompact.length <= 5) return false;
    if (["indica", "sativa", "hybrid"].includes(w)) return false;
    if (/^\d+(mg|g|oz|ml)?$/.test(w)) return false;
    return true;
  });

  const useful = words.filter((w) => w.length >= 3);
  const named = useful.length >= 1;
  const name = named ? title(useful.slice(0, 5)) : null;

  return { name, brand, strain, sub, weight, named };
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const report = {};
  let named = 0, unnamed = 0;

  for (const [category, items] of Object.entries(manifest)) {
    if (category === "_site") continue;
    report[category] = [];
    for (const img of items) {
      const d = derive(img, category);
      report[category].push({ slug: img.slug, ...d });
      d.named ? named++ : unnamed++;
    }
  }

  fs.writeFileSync(
    path.join(process.cwd(), "public", "products", "derived.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(`derived names: ${named} usable, ${unnamed} unnameable\n`);
  for (const [cat, items] of Object.entries(report)) {
    const withBrand = items.filter((i) => i.brand).length;
    const withSub = items.filter((i) => i.sub).length;
    console.log(`${cat.padEnd(14)} ${String(items.length).padStart(3)} images · ${withBrand} with brand · ${withSub} with subcategory`);
    items.filter((i) => i.named).slice(0, 4).forEach((i) =>
      console.log(`   ${(i.brand ?? "—").padEnd(18)} ${i.name}  [${i.sub ?? "?"} · ${i.weight} · ${i.strain}]`));
  }
}

/* Comparing import.meta.url to argv[1] is unreliable on Windows paths, and
   argv[1] is undefined under `node -e`. Callers that only want derive() set
   DERIVE_AS_MODULE. */
if (!process.env.DERIVE_AS_MODULE) main();
