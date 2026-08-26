/* The complete Weedmaps product taxonomy: every top-level category and the
   subcategories beneath it. This is the real shape of the catalogue — the
   product tables hang off it. */

export const CATEGORIES = [
  {
    slug: "flower", name: "Flower", sortOrder: 1,
    blurb: "Cured bud, sold by the eighth, quarter, half and ounce.",
    subs: ["Whole bud", "Smalls", "Shake & ground", "Infused flower", "Big buds", "Pre-ground"],
  },
  {
    slug: "pre-rolls", name: "Pre-rolls", sortOrder: 2,
    blurb: "Rolled and ready. Packs run five to ten.",
    subs: ["Singles", "Minis", "Multi-packs", "Blunts", "Infused pre-rolls", "Hash holes"],
  },
  {
    slug: "vape", name: "Vape pens", sortOrder: 3,
    blurb: "Carts, pods and all-in-ones. Check the hardware, not just the oil.",
    subs: ["Cartridges", "Disposables", "Pods", "Batteries", "Live resin carts", "Distillate carts"],
  },
  {
    slug: "concentrates", name: "Concentrates", sortOrder: 4,
    blurb: "Solvent and solventless extracts, sold by the gram.",
    subs: ["Live rosin", "Rosin", "Badder & batter", "Shatter", "Diamonds", "Sauce", "Sugar", "Crumble", "HTE", "Ice water hash", "Kief", "Crystalline", "RSO"],
  },
  {
    slug: "edibles", name: "Edibles", sortOrder: 5,
    blurb: "Eaten, not inhaled. Onset runs 45 to 90 minutes.",
    subs: ["Gummies", "Chocolate", "Mints", "Baked goods", "Hard candy", "Caramels & chews", "Tablets & capsules", "Cooking & mix-ins"],
  },
  {
    slug: "beverages", name: "Beverages", sortOrder: 6,
    blurb: "Fast-onset drinks, usually 2 to 10mg a can.",
    subs: ["Seltzers", "Sodas", "Shots", "Tonics", "Teas", "Coffee", "Drink powders"],
  },
  {
    slug: "wellness", name: "Wellness", sortOrder: 7,
    blurb: "Tinctures, balms and patches. Topicals do not get you high.",
    subs: ["Tinctures", "Capsules", "Patches", "Balms & salves", "Creams & lotions", "Bath", "Lubricants", "RSO & extract oils", "Suppositories"],
  },
  {
    slug: "gear", name: "Gear", sortOrder: 8,
    blurb: "Grinders, glass, papers and storage.",
    subs: ["Grinders", "Rolling papers", "Bongs & water pipes", "Hand pipes", "Bubblers", "Dab rigs & tools", "Vaporizers", "Storage", "Trays", "Lighters & torches", "Apparel"],
  },
  {
    slug: "genetics", name: "Genetics", sortOrder: 9,
    blurb: "Seeds and clones, where your state allows home grow.",
    subs: ["Feminized seeds", "Autoflower seeds", "Regular seeds", "Clones", "Seed packs"],
  },
];

/* Real cannabis brands. Product counts and category labels are demo values. */
export const BRANDS = [
  ["Cookies", "Flower · Vape", true], ["STIIIZY", "Vape · Concentrate", true],
  ["Raw Garden", "Live resin", true], ["Wyld", "Edibles", true],
  ["Kiva Confections", "Edibles", true], ["Jeeter", "Pre-rolls", true],
  ["Connected Cannabis Co.", "Flower", true], ["Alien Labs", "Flower", true],
  ["710 Labs", "Solventless", true], ["Papa & Barkley", "Wellness", true],
  ["Heavy Hitters", "Vape", true], ["Select", "Vape", true],
  ["Camino", "Edibles", true], ["Glass House Farms", "Flower", true],
  ["Lowell Farms", "Flower · Pre-rolls", true], ["Pacific Stone", "Flower", true],
  ["Claybourne", "Flower · Pre-rolls", false], ["Almora Farm", "Flower", false],
  ["Kanha", "Edibles", false], ["Plus Products", "Edibles", false],
  ["Cann", "Beverages", false], ["Friendly Farms", "Live resin", false],
  ["Bloom", "Vape", false], ["Punch Edibles", "Edibles", false],
  ["Absolute Xtracts", "Vape", false], ["Legion of Bloom", "Vape", false],
  ["Care By Design", "Wellness", false], ["Sherbinskis", "Flower", false],
  ["Jungle Boys", "Flower", false], ["Fig Farms", "Flower", false],
  ["Wonderbrett", "Flower", false], ["Old Pal", "Flower · Pre-rolls", false],
  ["Grizzly Peak", "Flower", false], ["Humboldt Farms", "Flower", false],
  ["Flav", "Edibles · Vape", false], ["Dime Industries", "Vape", false],
  ["Rove", "Vape", false], ["Timeless", "Vape", false],
  ["Cake", "Vape", false], ["Turn", "Vape", false],
  ["Nasha", "Hash", false], ["Buddies", "Concentrates", false],
  ["Pure Beauty", "Flower · Pre-rolls", false], ["Space Coyote", "Pre-rolls", false],
  ["Garden Society", "Edibles", false], ["Kikoko", "Beverages · Wellness", false],
  ["Lost Farm", "Edibles", false], ["Terra", "Edibles", false],
  ["Petra", "Edibles", false], ["Wana", "Edibles", false],
  ["Incredibles", "Edibles", false], ["District Edibles", "Edibles", false],
  ["Smokiez", "Edibles", false], ["Keef", "Beverages", false],
  ["Pabst Labs", "Beverages", false], ["Uncle Arnie's", "Beverages", false],
  ["BREZ", "Beverages", false], ["Mary's Medicinals", "Wellness", false],
  ["Yummi Karma", "Wellness", false], ["Foria", "Wellness", false],
  ["Kush Queen", "Wellness", false], ["Proof", "Wellness", false],
  ["Puffco", "Gear", false], ["Santa Cruz Shredder", "Gear", false],
  ["RYOT", "Gear", false], ["OCB", "Gear", false],
  ["RAW", "Gear", false], ["Elements", "Gear", false],
  ["GRAV", "Gear", false], ["Session Goods", "Gear", false],
  ["Marley Natural", "Gear", false], ["Dr. Dabber", "Gear", false],
  ["Humboldt Seed Company", "Genetics", false], ["Ethos Genetics", "Genetics", false],
  ["Compound Genetics", "Genetics", false], ["In House Genetics", "Genetics", false],
  ["Sunset Connect", "Flower", false], ["Doja", "Flower", false],
  ["Gold Flora", "Flower", false], ["Emerald Bay Extracts", "Concentrates", false],
];
