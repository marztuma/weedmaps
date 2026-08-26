import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes, randomInt, scryptSync } from "node:crypto";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as raw, eq } from "drizzle-orm";
import * as schema from "./schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

const hashPassword = (pw) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
};

/* Readable but strong: 4 words + digits + symbol. Long enough to resist
   guessing, typable enough that nobody writes it on a sticky note. */
const WORDS = ["harvest", "linen", "orange", "cobalt", "meadow", "cinder", "quartz", "pollen",
               "amber", "thistle", "copper", "juniper", "saffron", "basalt", "willow", "cedar"];
function makePassword() {
  const pick = () => WORDS[randomInt(WORDS.length)];
  const word = () => { const w = pick(); return w[0].toUpperCase() + w.slice(1); };
  return `${word()}-${pick()}-${word()}-${randomInt(1000, 9999)}!`;
}

const FIRST = ["Marcus", "Elena", "Devon", "Priya", "Jonah", "Camille", "Tobias", "Nadia",
               "Rowan", "Simone", "Andre", "Keiko", "Milo", "Farrah", "Ivan", "Lucia",
               "Desmond", "Anika", "Reuben", "Sasha"];
const LAST = ["Okafor", "Vasquez", "Whitfield", "Ramanathan", "Brennan", "Dubois", "Lindqvist",
              "Haddad", "Mercer", "Alvarez", "Petrov", "Tanaka", "Ferraro", "Nassar",
              "Kovac", "Moreau", "Blackwood", "Chaudhry", "Stein", "Ilyich"];
const CITIES = ["Venice", "Silver Lake", "Echo Park", "Culver City", "Highland Park", "DTLA",
                "Santa Monica", "Los Feliz", "Mid-City", "Koreatown", "Eagle Rock", "Westwood"];
const STAGES = ["lead", "first_order", "repeat", "vip", "lapsed"];
const TAGS = ["edibles", "flower", "vape", "concentrates", "high-value", "weeknight",
              "price-sensitive", "wellness", "newsletter"];
const STATUSES = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];

const pickOne = (a) => a[randomInt(a.length)];
const pickSome = (a, n) => [...a].sort(() => randomInt(3) - 1).slice(0, n);

async function main() {
  const force = process.argv.includes("--reset-password");

  console.log("seeding CRM…");
  await db.execute(raw`TRUNCATE TABLE order_items, orders, customer_notes, customers RESTART IDENTITY CASCADE`);

  const shopRows = await db.select({ id: schema.shops.id }).from(schema.shops);
  const productRows = await db.select({
    id: schema.products.id, name: schema.products.name, priceCents: schema.products.priceCents,
    brandId: schema.products.brandId,
  }).from(schema.products);
  const brandRows = await db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands);
  const brandName = new Map(brandRows.map((b) => [b.id, b.name]));

  // customers
  const customerValues = [];
  const used = new Set();
  for (let i = 0; i < 48; i++) {
    const first = pickOne(FIRST), last = pickOne(LAST);
    let email = `${first}.${last}${i}`.toLowerCase().replace(/[^a-z0-9.]/g, "") + "@example.com";
    while (used.has(email)) email = `x${email}`;
    used.add(email);
    customerValues.push({
      name: `${first} ${last}`,
      email,
      phone: `(310) ${randomInt(200, 999)}-${String(randomInt(0, 9999)).padStart(4, "0")}`,
      address: `${randomInt(100, 9999)} ${pickOne(["Abbot Kinney", "Sunset", "Melrose", "Venice", "Beverly", "Fairfax"])} Blvd`,
      city: pickOne(CITIES),
      stage: pickOne(STAGES),
      tags: pickSome(TAGS, randomInt(1, 4)),
      ageVerified: randomInt(10) > 1,
      marketingOptIn: randomInt(10) > 4,
    });
  }
  const insertedCustomers = await db.insert(schema.customers).values(customerValues)
    .returning({ id: schema.customers.id, name: schema.customers.name });
  console.log(`  customers      ${insertedCustomers.length}`);

  // orders + items
  let orderCount = 0, itemCount = 0;
  for (const c of insertedCustomers) {
    const n = randomInt(0, 4);
    for (let o = 0; o < n; o++) {
      const items = pickSome(productRows, randomInt(1, 5));
      if (!items.length) continue;
      const subtotal = items.reduce((s, p) => s + p.priceCents, 0);
      const fee = pickOne([0, 0, 400, 500, 700]);
      const status = pickOne(STATUSES);
      const daysAgo = randomInt(0, 60);
      const placed = new Date(Date.now() - daysAgo * 864e5);
      const [order] = await db.insert(schema.orders).values({
        reference: `WM-${String(100000 + orderCount + 1)}`,
        customerId: c.id,
        shopId: shopRows.length ? pickOne(shopRows).id : null,
        status,
        subtotalCents: subtotal,
        deliveryFeeCents: fee,
        totalCents: subtotal + fee,
        placedAt: placed,
        deliveredAt: status === "delivered" ? new Date(placed.getTime() + 3600e3) : null,
      }).returning({ id: schema.orders.id });
      await db.insert(schema.orderItems).values(items.map((p) => ({
        orderId: order.id,
        productId: p.id,
        nameSnapshot: p.name,
        brandSnapshot: brandName.get(p.brandId) ?? null,
        unitPriceCents: p.priceCents,
        qty: randomInt(1, 3),
      })));
      orderCount++; itemCount += items.length;
    }
  }
  console.log(`  orders         ${orderCount}`);
  console.log(`  order items    ${itemCount}`);

  // a few CRM notes
  const noteBodies = [
    "Called about a delayed delivery — comped the fee, customer happy.",
    "Prefers indica for sleep. Recommend Camino Midnight Blueberry on next contact.",
    "Asked about bulk pricing on eighths. Flagged for the wholesale list.",
    "Age verification re-checked at the door. All good.",
    "Complained about potency labelling — sent the COA, resolved.",
    "High-value repeat buyer. Worth a loyalty offer.",
  ];
  const noteValues = [];
  for (const c of pickSome(insertedCustomers, 18)) {
    noteValues.push({ customerId: c.id, authorName: "Weedmaps Admin", body: pickOne(noteBodies) });
  }
  if (noteValues.length) await db.insert(schema.customerNotes).values(noteValues);
  console.log(`  notes          ${noteValues.length}`);

  // admin user
  const [existing] = await db.select().from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, "admin")).limit(1);

  if (existing && !force) {
    console.log("\nadmin user already exists — password left untouched.");
    console.log("re-run with --reset-password to issue a new one.");
    return;
  }

  const password = makePassword();
  const hash = hashPassword(password);

  if (existing) {
    await db.update(schema.adminUsers).set({ passwordHash: hash, active: true })
      .where(eq(schema.adminUsers.id, existing.id));
  } else {
    await db.insert(schema.adminUsers).values({
      username: "admin",
      email: "admin@weedmaps.local",
      displayName: "Weedmaps Admin",
      passwordHash: hash,
      role: "administrator",
    });
  }

  console.log("\n" + "=".repeat(56));
  console.log("  ADMIN LOGIN — shown once, stored only as a scrypt hash");
  console.log("=".repeat(56));
  console.log(`  URL       http://localhost:3100/admin/login`);
  console.log(`  Username  admin`);
  console.log(`  Password  ${password}`);
  console.log("=".repeat(56));
}

main().catch((e) => { console.error(e); process.exit(1); });
