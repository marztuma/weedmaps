import { sitemapEntries, sitemapXml } from "@/lib/site-map-data";

/* Served as a route handler rather than through app/sitemap.js.

   Next's metadata-route loader generates a JS string that is single-quoted
   around a double-quoted path; this project's directory name contains an
   apostrophe, so that generated module fails to parse. A plain route handler
   never touches that loader and produces byte-identical output. */

export const revalidate = 3600;

export async function GET() {
  const xml = sitemapXml(await sitemapEntries());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, must-revalidate",
    },
  });
}
