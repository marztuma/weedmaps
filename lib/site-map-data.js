import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { SITE_URL } from "@/lib/seo";

/* The sitemap's content, kept apart from how it is served.

   Only pages worth indexing appear. Checkout, the confirmation page and the
   whole admin are omitted: one is transactional, one is per-order and private,
   and the third is behind a login. Search result pages are omitted too — an
   infinite query space is a crawl trap, not content.

   Priority is relative and only meaningful within one site, so it is used to
   say what matters here: the shelf over the editorial, live goods over paused. */

export async function sitemapEntries(now = new Date()) {
  const [products, categories, brands, shops] = await Promise.all([
    db.select({ slug: schema.products.slug, updated: schema.products.createdAt })
      .from(schema.products),
    db.select({ slug: schema.categories.slug }).from(schema.categories),
    // Only brands that actually carry products. A brand page with an empty
    // shelf is a thin page, and submitting dozens of them is a reliable way to
    // have a new site's whole crawl treated as low value.
    db.select({ slug: schema.brands.slug })
      .from(schema.brands)
      .innerJoin(schema.products, eq(schema.products.brandId, schema.brands.id))
      .groupBy(schema.brands.slug),
    db.select({ slug: schema.shops.slug, live: schema.shops.deliveringNow }).from(schema.shops),
  ]);

  const statics = [
    ["", 1.0, "daily"],
    ["/products", 0.9, "daily"],
    ["/deliveries", 0.8, "daily"],
    ["/brands", 0.7, "weekly"],
    ["/deals", 0.8, "daily"],
  ].map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority,
  }));

  return [
    ...statics,
    ...categories.map((c) => ({
      url: `${SITE_URL}/products/${c.slug}`,
      lastModified: now, changeFrequency: "daily", priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: p.updated ?? now, changeFrequency: "daily", priority: 0.7,
    })),
    ...shops.map((s) => ({
      url: `${SITE_URL}/delivery/${s.slug}`,
      lastModified: now, changeFrequency: "daily",
      // a paused service is still a real page, just a less useful landing
      priority: s.live ? 0.7 : 0.4,
    })),
    ...brands.map((b) => ({
      url: `${SITE_URL}/brand/${b.slug}`,
      lastModified: now, changeFrequency: "weekly", priority: 0.6,
    })),
  ];
}

const xmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function sitemapXml(entries) {
  const body = entries.map((e) => `  <url>
    <loc>${xmlEscape(e.url)}</loc>
    <lastmod>${new Date(e.lastModified).toISOString()}</lastmod>
    <changefreq>${e.changeFrequency}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
