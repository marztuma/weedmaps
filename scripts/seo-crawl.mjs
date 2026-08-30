import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import * as schema from "../db/schema.js";

neonConfig.fetchFunction = async (input, init) => {
  for (let i = 1; i <= 4; i++) {
    try { return await fetch(input, init); }
    catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, i * 300)); }
  }
};
const db = drizzle(neon(process.env.DATABASE_URL), { schema });

/* Writes the seocrawl/ folder: every indexable URL on this site, in the forms
   Google actually accepts.
 *
 * Built from the same rules as lib/site-map-data.js — live database, brands
 * with no products excluded, checkout and admin excluded. If the two ever
 * disagree, one of them is lying to a crawler, so both read the catalogue
 * rather than a list someone maintains by hand.
 *
 * Run: npm run seo:crawl
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://weedmaps-iota.vercel.app").replace(/\/$/, "");
const OUT = path.join(process.cwd(), "seocrawl");

const learn = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "learn.json"), "utf8"));

async function main() {
  const [products, categories, shops, brandsWithStock] = await Promise.all([
    db.select({ slug: schema.products.slug }).from(schema.products),
    db.select({ slug: schema.categories.slug }).from(schema.categories),
    db.select({ slug: schema.shops.slug }).from(schema.shops),
    /* Only brands that carry something. A brand page with an empty shelf is a
       thin page, and handing a crawler dozens of them is how a new site's
       whole crawl gets treated as low value. */
    db.select({ slug: schema.brands.slug })
      .from(schema.brands)
      .innerJoin(schema.products, eq(schema.products.brandId, schema.brands.id))
      .groupBy(schema.brands.slug),
  ]);

  const groups = {
    "core-pages": ["", "/products", "/deliveries", "/brands", "/deals", "/learn"],
    "categories": categories.map((c) => `/products/${c.slug}`),
    "products": products.map((p) => `/product/${p.slug}`),
    "delivery-services": shops.map((s) => `/delivery/${s.slug}`),
    "brands": brandsWithStock.map((b) => `/brand/${b.slug}`),
    "learn-articles": learn.reads.map((r) => `/learn/${r.slug}`),
  };

  const all = Object.values(groups).flat().map((p) => `${SITE}${p || "/"}`);
  const unique = [...new Set(all)];

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  /* A plain list, one URL per line.

     This is not just a convenience: a .txt file of URLs is a sitemap format
     Google accepts outright, so this can be uploaded and submitted as-is, or
     pasted in batches into the URL Inspection tool. */
  fs.writeFileSync(path.join(OUT, "all-urls.txt"), unique.join("\n") + "\n");

  // The same set as XML, for anything that wants the richer format.
  const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const now = new Date().toISOString();
  fs.writeFileSync(
    path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      unique.map((u) => `  <url><loc>${xmlEscape(u)}</loc><lastmod>${now}</lastmod></url>`).join("\n") +
      `\n</urlset>\n`
  );

  /* Split by section too. Search Console's inspection tool is one URL at a
     time and rate limited, so working through 600 in one list is unrealistic —
     these let you do the pages that matter first and leave the long tail to
     the sitemap. */
  const lines = [];
  for (const [name, paths] of Object.entries(groups)) {
    const urls = [...new Set(paths.map((p) => `${SITE}${p || "/"}`))];
    fs.writeFileSync(path.join(OUT, `${name}.txt`), urls.join("\n") + "\n");
    lines.push(`  ${name.padEnd(20)} ${String(urls.length).padStart(4)}`);
  }

  fs.writeFileSync(
    path.join(OUT, "README.md"),
    `# seocrawl

${unique.length} indexable URLs, generated ${now} from the live catalogue.

Regenerate with \`npm run seo:crawl\` — never edit these by hand. They are
built from the same rules as the live sitemap, so a hand edit would make one
of them wrong.

## Files

| File | What it is |
|---|---|
| \`all-urls.txt\` | Every URL, one per line |
| \`sitemap.xml\` | The same set as XML |
| \`core-pages.txt\` | The handful that matter most — submit these first |
| \`categories.txt\` | Category listings |
| \`products.txt\` | Product pages |
| \`delivery-services.txt\` | Delivery service pages |
| \`brands.txt\` | Brand pages that have stock |
| \`learn-articles.txt\` | Written guides |

## Using these with Google

**The sitemap is the main route.** In Search Console, Sitemaps, submit
\`sitemap.xml\` — the site serves it live at \`${SITE}/sitemap.xml\`, so it
stays current on its own and there is nothing to re-upload. That is the only
step most sites need.

**\`all-urls.txt\` is a valid sitemap too.** Google accepts a plain text file of
URLs, so it can be uploaded and submitted the same way if you want a static
snapshot rather than the live one.

**URL Inspection is one page at a time**, and requesting indexing is rate
limited to a handful per day. It is worth doing for \`core-pages.txt\` and
nothing else — the rest is what the sitemap is for. Submitting the same URL
repeatedly does not make it index faster.

## What is deliberately not here

- \`/checkout\` and \`/checkout/<reference>\` — transactional, and an order page
  carries somebody's address
- \`/admin\` — behind a login
- \`/search\` — an unbounded query space, which is a crawl trap rather than content
- Brand pages with no products — thin pages, and submitting dozens of them
  invites a low-value judgement on the whole crawl
- \`?page=\`, \`?sort=\`, \`?sub=\` variants — each listing page canonicalises to
  itself, and the crawler reaches the deeper pages by following the pager
`
  );

  console.log(`wrote ${unique.length} URLs to seocrawl/\n`);
  console.log(lines.join("\n"));
  console.log(`\n  site: ${SITE}`);
  if (SITE.includes("localhost")) {
    console.log("\n  WARNING: NEXT_PUBLIC_SITE_URL points at localhost, so these URLs are useless to Google.");
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
