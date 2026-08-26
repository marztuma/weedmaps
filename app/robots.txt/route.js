import { SITE_URL } from "@/lib/seo";

/* robots.txt

   Three things are kept out of the index, each for its own reason:

   /admin      — behind a login, and nothing there is for the public.
   /checkout   — transactional, and /checkout/WM-XXXXXX is somebody's order,
                 carrying their address and a payment destination. It must never
                 be crawled, cached or surfaced.
   /search?q=  — an unbounded query space. Crawling it burns budget on pages
                 that are permutations of the catalogue rather than content.

   Disallow is not a security control — it is a request that well-behaved
   crawlers honour. The admin is protected by its session guard, and order
   pages are also marked noindex in their own metadata.

   A route handler, not app/robots.js, for the loader reason documented in
   app/sitemap.xml/route.js. */

export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-Agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /checkout",
    "Disallow: /checkout/",
    "Disallow: /search",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
