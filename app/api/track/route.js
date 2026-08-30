import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";

/* First-party page-view tracking.
 *
 * What is deliberately not collected: no IP address is stored, no user agent,
 * no fingerprint, no full referrer. A referrer URL can carry a search query or
 * a private path, so only its hostname is kept — which answers "where did they
 * come from" just as well. The visitor key is minted by the browser and
 * clearing site data produces a new one, which is the correct behaviour rather
 * than a limitation to engineer around.
 *
 * That leaves this useful for the question an operator actually has — what are
 * people looking at, what brought them, how many came back — without building a
 * profile of a person who never agreed to one.
 *
 * Public and unauthenticated, so it is rate-limited and every field is bounded.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VIEWS_PER_VISITOR_PER_HOUR = 300;

const validKey = (k) => typeof k === "string" && /^[a-z0-9]{16,48}$/.test(k);

/** Hostname only, and only when it is somewhere else. A self-referrer is
 *  internal navigation and says nothing about acquisition. */
function referrerHost(ref, selfHost) {
  if (!ref) return null;
  try {
    const h = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    if (!h || h === selfHost) return null;
    return h.slice(0, 128);
  } catch {
    return null;
  }
}

/** Paths are bounded and stripped of their query string: ?q= on the search
 *  page is a person's search term, which is not ours to keep. */
const cleanPath = (p) => {
  if (typeof p !== "string" || !p.startsWith("/")) return null;
  return p.split("?")[0].split("#")[0].slice(0, 256);
};

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const key = payload?.k;
  const path = cleanPath(payload?.p);
  if (!validKey(key) || !path) return Response.json({ ok: false }, { status: 400 });

  const selfHost = (() => {
    try { return new URL(request.url).hostname.replace(/^www\./, ""); } catch { return ""; }
  })();
  const ref = referrerHost(payload?.r, selfHost);

  // Vercel supplies this at the edge; it is a country, not a location.
  const country = (request.headers.get("x-vercel-ip-country") || "").slice(0, 2).toUpperCase() || null;

  try {
    const [visitor] = await db
      .insert(schema.visitors)
      .values({
        visitorKey: key,
        pageViews: 1,
        referrerHost: ref,
        landingPath: path,
        country,
      })
      .onConflictDoUpdate({
        target: schema.visitors.visitorKey,
        set: {
          lastSeenAt: new Date(),
          pageViews: sql`${schema.visitors.pageViews} + 1`,
        },
      })
      .returning({ id: schema.visitors.id, views: schema.visitors.pageViews });

    /* A cheap ceiling on how much one browser can write. Without it a loop
       against this endpoint fills the table, and the per-visitor counter is
       already to hand. */
    if (visitor.views <= MAX_VIEWS_PER_VISITOR_PER_HOUR) {
      await db.insert(schema.pageViews).values({
        visitorId: visitor.id,
        path,
        referrerHost: ref,
      });
    }
  } catch {
    // Analytics must never be the reason a page misbehaves.
  }

  // 204: the beacon wants nothing back.
  return new Response(null, { status: 204 });
}
