import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { maskEmail } from "@/lib/mail/safe";

export const dynamic = "force-dynamic";

/* One visitor's path through the site.
 *
 * The list view answers "how many"; this answers "what happened". Read down
 * the page and you can see where somebody arrived, what they looked at, how
 * long they lingered, and where they stopped — which is usually the more
 * useful question, because the page they stopped on is the page that failed.
 *
 * A visitor is still a browser here, not a person. There is no IP address and
 * no user agent to show, because none was ever collected. If a name and an
 * address appear at the top it is because that person typed them into a form
 * themselves.
 */

const when = (d) =>
  new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });

/** Gap between two steps, which is the closest thing to "time on page" that
 *  honest page-view tracking can give. The last step has no successor, so it
 *  has no duration — saying "0 seconds" there would be inventing a fact. */
function gap(a, b) {
  if (!b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (ms < 1000) return "under a second";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default async function VisitorPath({ params }) {
  const { key } = await params;

  const [visitor] = await db
    .select({
      id: schema.visitors.id,
      key: schema.visitors.visitorKey,
      first: schema.visitors.firstSeenAt,
      last: schema.visitors.lastSeenAt,
      views: schema.visitors.pageViews,
      ref: schema.visitors.referrerHost,
      landing: schema.visitors.landingPath,
      country: schema.visitors.country,
      subscriberId: schema.visitors.subscriberId,
      email: schema.subscribers.email,
      subscribedAt: schema.subscribers.consentedAt,
      subStatus: schema.subscribers.status,
    })
    .from(schema.visitors)
    .leftJoin(schema.subscribers, eq(schema.visitors.subscriberId, schema.subscribers.id))
    .where(eq(schema.visitors.visitorKey, key))
    .limit(1);

  if (!visitor) notFound();

  const [steps, [totals]] = await Promise.all([
    db.select({
      path: schema.pageViews.path,
      at: schema.pageViews.viewedAt,
      ref: schema.pageViews.referrerHost,
    })
      .from(schema.pageViews)
      .where(eq(schema.pageViews.visitorId, visitor.id))
      .orderBy(asc(schema.pageViews.viewedAt))
      .limit(400),
    db.select({
      distinct: sql`count(distinct ${schema.pageViews.path})`.mapWith(Number),
    }).from(schema.pageViews).where(eq(schema.pageViews.visitorId, visitor.id)),
  ]);

  const span = steps.length > 1
    ? gap(steps[0].at, steps[steps.length - 1].at)
    : null;

  return (
    <>
      <h1 className="wp-title">
        Visitor path
        <Link href="/admin/audience" className="wp-btn" style={{ marginLeft: 12, fontSize: 13 }}>
          ‹ All visitors
        </Link>
      </h1>
      <p className="wp-subtitle">
        <code>{visitor.key}</code> — a token this browser minted. Not a person, and not linked to
        one unless they gave an address themselves.
      </p>

      <div className="wp-cards">
        <div className="wp-card"><strong>{visitor.views}</strong><span>Page views</span></div>
        <div className="wp-card"><strong>{totals.distinct}</strong><span>Distinct pages</span></div>
        <div className="wp-card"><strong>{span ?? "—"}</strong><span>First to last</span></div>
        <div className="wp-card">
          <strong>{visitor.email ? "Yes" : "No"}</strong><span>Gave an address</span>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Where they came from</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <tbody>
              <tr><td style={{ width: 200 }}>First seen</td><td>{when(visitor.first)}</td></tr>
              <tr><td>Last seen</td><td>{when(visitor.last)}</td></tr>
              <tr>
                <td>Arrived from</td>
                <td>{visitor.ref ?? <span className="wp-help">direct — typed, bookmarked or an app</span>}</td>
              </tr>
              <tr>
                <td>Landed on</td>
                <td><Link href={visitor.landing ?? "/"} target="_blank">{visitor.landing}</Link></td>
              </tr>
              <tr><td>Country</td><td>{visitor.country ?? <span className="wp-help">not recorded</span>}</td></tr>
              <tr>
                <td>Address</td>
                <td>
                  {visitor.email ? (
                    <>
                      {maskEmail(visitor.email)}
                      <span className={`wp-pill ${visitor.subStatus === "subscribed" ? "is-green" : "is-grey"}`} style={{ marginLeft: 8 }}>
                        {visitor.subStatus}
                      </span>
                      {!visitor.subscribedAt && (
                        <span className="wp-pill is-amber" style={{ marginLeft: 6 }}>no consent — not mailable</span>
                      )}
                    </>
                  ) : (
                    <span className="wp-help">never gave one</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">The path — {steps.length} step{steps.length === 1 ? "" : "s"}, oldest first</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th style={{ width: 210 }}>When</th>
                <th>Page</th>
                <th style={{ width: 120 }}>Stayed</th>
              </tr>
            </thead>
            <tbody>
              {steps.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: "center" }}>
                  No page views recorded for this visitor.
                </td></tr>
              )}
              {steps.map((s, i) => (
                <tr key={`${s.at}-${i}`}>
                  <td className="wp-help">{i + 1}</td>
                  <td className="wp-help">{when(s.at)}</td>
                  <td>
                    <Link href={s.path} target="_blank">{s.path}</Link>
                    {s.ref && <span className="wp-help"> · from {s.ref}</span>}
                  </td>
                  <td className="wp-help">
                    {gap(s.at, steps[i + 1]?.at) ?? (
                      <span title="Nothing followed it, so there is nothing to measure against">
                        left here
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
