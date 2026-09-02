import Link from "next/link";
import { sql, desc, eq, gte, and, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { maskEmail } from "@/lib/mail/safe";

export const dynamic = "force-dynamic";

/* Audience — the analytics overview.
 *
 * Every figure is a live count. The one that matters most is the conversion
 * from visitor to subscriber, because it is the only number here that says
 * whether any of the rest is working.
 *
 * Addresses are masked. This screen is the kind that gets shown on a shared
 * display, and a subscriber list is exactly what should not be readable over
 * someone's shoulder. */

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "—");

const when = (d) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default async function Audience() {
  const since = new Date(Date.now() - 30 * 86400_000);
  const week = new Date(Date.now() - 7 * 86400_000);

  const [[totals], topPages, referrers, recent, [subs], daily] = await Promise.all([
    db.select({
      visitors: sql`(select count(*) from visitors)`.mapWith(Number),
      visitors30: sql`(select count(*) from visitors where last_seen_at > ${since})`.mapWith(Number),
      views: sql`(select count(*) from page_views)`.mapWith(Number),
      views7: sql`(select count(*) from page_views where viewed_at > ${week})`.mapWith(Number),
      returning: sql`(select count(*) from visitors where page_views > 1)`.mapWith(Number),
      converted: sql`(select count(*) from visitors where subscriber_id is not null)`.mapWith(Number),
    }).from(sql`(select 1) as t`),

    db.select({ path: schema.pageViews.path, n: sql`count(*)`.mapWith(Number) })
      .from(schema.pageViews)
      .where(gte(schema.pageViews.viewedAt, since))
      .groupBy(schema.pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10),

    db.select({ host: schema.visitors.referrerHost, n: sql`count(*)`.mapWith(Number) })
      .from(schema.visitors)
      .where(isNotNull(schema.visitors.referrerHost))
      .groupBy(schema.visitors.referrerHost)
      .orderBy(desc(sql`count(*)`))
      .limit(8),

    db.select({
      key: schema.visitors.visitorKey,
      views: schema.visitors.pageViews,
      landing: schema.visitors.landingPath,
      ref: schema.visitors.referrerHost,
      country: schema.visitors.country,
      first: schema.visitors.firstSeenAt,
      last: schema.visitors.lastSeenAt,
      email: schema.subscribers.email,
    }).from(schema.visitors)
      .leftJoin(schema.subscribers, eq(schema.visitors.subscriberId, schema.subscribers.id))
      .orderBy(desc(schema.visitors.lastSeenAt))
      .limit(25),

    db.select({
      total: sql`count(*)`.mapWith(Number),
      active: sql`count(*) filter (where status = 'subscribed' and consented_at is not null)`.mapWith(Number),
      unsubscribed: sql`count(*) filter (where status = 'unsubscribed')`.mapWith(Number),
      noConsent: sql`count(*) filter (where consented_at is null)`.mapWith(Number),
    }).from(schema.subscribers),

    db.select({
      day: sql`date_trunc('day', ${schema.pageViews.viewedAt})`.mapWith(String),
      n: sql`count(*)`.mapWith(Number),
    }).from(schema.pageViews)
      .where(gte(schema.pageViews.viewedAt, week))
      .groupBy(sql`date_trunc('day', ${schema.pageViews.viewedAt})`)
      .orderBy(sql`date_trunc('day', ${schema.pageViews.viewedAt})`),
  ]);

  const peak = Math.max(1, ...daily.map((d) => d.n));

  return (
    <>
      <h1 className="wp-title">Audience</h1>
      <p className="wp-subtitle">
        Visitors are browsers, not people — a random token this site mints, cleared whenever
        someone clears their site data. No IP address, user agent or full referrer is stored.
      </p>

      <div className="wp-cards">
        <div className="wp-card"><strong>{totals.visitors}</strong><span>Visitors, all time</span></div>
        <div className="wp-card"><strong>{totals.visitors30}</strong><span>Active in 30 days</span></div>
        <div className="wp-card"><strong>{totals.views}</strong><span>Page views</span></div>
        <div className="wp-card"><strong>{subs.active}</strong><span>Subscribers with consent</span></div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Page views, last 7 days</div>
        <div className="wp-box-body">
          {daily.length === 0 ? (
            <p className="wp-help" style={{ margin: 0 }}>Nothing recorded yet.</p>
          ) : (
            <table className="wp-table">
              <tbody>
                {daily.map((d) => (
                  <tr key={d.day}>
                    <td style={{ width: 120 }} className="wp-help">
                      {new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td>
                      <div className="wp-meter" style={{ width: `${(d.n / peak) * 100}%` }} />
                    </td>
                    <td style={{ width: 60, textAlign: "right" }}>{d.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">
          Visitor to subscriber — {totals.converted} of {totals.visitors} ({pct(totals.converted, totals.visitors)})
        </div>
        <div className="wp-box-body">
          <p className="wp-help" style={{ marginTop: 0 }}>
            {totals.returning} of {totals.visitors} visitors came back more than once.
            {subs.noConsent > 0 && (
              <> {subs.noConsent} subscriber row{subs.noConsent === 1 ? " has" : "s have"} no
              recorded consent and will never be sent a campaign.</>
            )}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="wp-box">
          <div className="wp-box-head">Most viewed, 30 days</div>
          <div className="wp-table-wrap">
            <table className="wp-table">
              <tbody>
                {topPages.length === 0 && <tr><td style={{ padding: 16 }}>Nothing yet.</td></tr>}
                {topPages.map((p) => (
                  <tr key={p.path}>
                    <td><Link href={p.path} target="_blank">{p.path}</Link></td>
                    <td style={{ width: 70, textAlign: "right" }}>{p.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="wp-box">
          <div className="wp-box-head">Where they came from</div>
          <div className="wp-table-wrap">
            <table className="wp-table">
              <tbody>
                {referrers.length === 0 && (
                  <tr><td style={{ padding: 16 }} className="wp-help">
                    No external referrers yet — everything so far arrived directly.
                  </td></tr>
                )}
                {referrers.map((r) => (
                  <tr key={r.host}>
                    <td>{r.host}</td>
                    <td style={{ width: 70, textAlign: "right" }}>{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Recent visitors</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>Visitor</th>
                <th style={{ width: 60 }}>Views</th>
                <th>Landed on</th>
                <th style={{ width: 130 }}>From</th>
                <th style={{ width: 60 }}>Country</th>
                <th style={{ width: 150 }}>First seen</th>
                <th style={{ width: 150 }}>Last seen</th>
                <th style={{ width: 180 }}>Subscriber</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center" }}>
                  No visits recorded yet.
                </td></tr>
              )}
              {recent.map((v) => (
                <tr key={v.key}>
                  <td>
                    <Link href={`/admin/audience/${v.key}`} title="See every page this browser visited">
                      {v.key.slice(0, 10)}…
                    </Link>
                  </td>
                  <td>{v.views}</td>
                  <td><Link href={v.landing ?? "/"} target="_blank">{v.landing}</Link></td>
                  <td className="wp-help">{v.ref ?? "direct"}</td>
                  <td className="wp-help">{v.country ?? "—"}</td>
                  <td className="wp-help">{when(v.first)}</td>
                  <td className="wp-help">{when(v.last)}</td>
                  <td>{v.email ? maskEmail(v.email) : <span className="wp-help">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
