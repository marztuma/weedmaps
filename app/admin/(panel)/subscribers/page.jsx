import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { maskEmail } from "@/lib/mail/safe";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { removeSubscriber, exportSubscribers } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

const VIEWS = [
  { value: "subscribed", label: "Subscribed" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "all", label: "All" },
];

const when = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function Subscribers({ searchParams }) {
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.value === sp?.view) ? sp.view : "subscribed";
  const page = Math.max(1, Number(sp?.paged) || 1);

  const clause = view === "all" ? undefined : eq(schema.subscribers.status, view);

  const [rows, [{ matching }], [counts]] = await Promise.all([
    db.select().from(schema.subscribers)
      .where(clause)
      .orderBy(desc(schema.subscribers.createdAt))
      .limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({ matching: sql`count(*)`.mapWith(Number) }).from(schema.subscribers).where(clause),
    db.select({
      subscribed: sql`count(*) filter (where status = 'subscribed')`.mapWith(Number),
      unsubscribed: sql`count(*) filter (where status = 'unsubscribed')`.mapWith(Number),
      all: sql`count(*)`.mapWith(Number),
      mailable: sql`count(*) filter (where status = 'subscribed' and consented_at is not null)`.mapWith(Number),
    }).from(schema.subscribers),
  ]);

  const pages = Math.max(1, Math.ceil(matching / PER_PAGE));
  const countFor = (v) => (v === "all" ? counts.all : v === "subscribed" ? counts.subscribed : counts.unsubscribed);

  return (
    <>
      <h1 className="wp-title">
        Subscribers
        <form action={exportSubscribers} style={{ display: "inline" }}>
          <button type="submit" className="wp-btn" style={{ marginLeft: 12, fontSize: 13 }}>
            Export CSV
          </button>
        </form>
      </h1>
      <Notice
        map={{
          removed: ["is-success", "Subscriber deleted."],
          exported: ["is-success", "Export ready."],
        }}
      />

      <p className="wp-subtitle">
        <strong>{counts.mailable}</strong> can be sent a campaign — subscribed, and with consent
        recorded. A row without a consent timestamp is never included in a send, whatever its
        status says.
      </p>

      <ul className="wp-subsubsub">
        {VIEWS.map((v, i) => (
          <li key={v.value}>
            {i > 0 && " | "}
            <Link
              href={`/admin/subscribers?view=${v.value}`}
              className={v.value === view ? "is-current" : ""}
              aria-current={v.value === view ? "page" : undefined}
            >
              {v.label} ({countFor(v.value)})
            </Link>
          </li>
        ))}
      </ul>

      <div className="wp-table-wrap">
        <table className="wp-table">
          <thead>
            <tr>
              <th>Email</th>
              <th style={{ width: 140 }}>Name</th>
              <th style={{ width: 120 }}>Status</th>
              <th style={{ width: 180 }}>Consent</th>
              <th style={{ width: 120 }}>Source</th>
              <th style={{ width: 100 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>
                No subscribers in this view.
              </td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td title="Masked on screen — use the export if you need the full address">
                  {maskEmail(s.email)}
                </td>
                <td>{s.name ?? <span className="wp-help">—</span>}</td>
                <td>
                  <span className={`wp-pill ${s.status === "subscribed" ? "is-green" : "is-grey"}`}>
                    {s.status}
                  </span>
                </td>
                <td>
                  {s.consentedAt
                    ? <span className="wp-help">{when(s.consentedAt)}</span>
                    : <span className="wp-pill is-red">none — not mailable</span>}
                </td>
                <td className="wp-help">{s.consentSource ?? "—"}</td>
                <td>
                  <ConfirmSubmit
                    className="wp-btn-plain is-danger"
                    form={`del-sub-${s.id}`}
                    message="Delete this subscriber permanently? Unsubscribing is usually the right action — deleting loses the record that they asked to leave."
                  >
                    Delete
                  </ConfirmSubmit>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.map((s) => (
        <form key={s.id} id={`del-sub-${s.id}`} action={removeSubscriber} hidden>
          <input type="hidden" name="id" value={s.id} />
        </form>
      ))}

      {pages > 1 && (
        <div className="wp-tablenav">
          <span className="wp-subtitle">Page {page} of {pages} · {matching} total</span>
          <div className="wp-tablenav-links">
            {page > 1 && <Link className="wp-btn" href={`/admin/subscribers?view=${view}&paged=${page - 1}`}>‹ Previous</Link>}
            {page < pages && <Link className="wp-btn" href={`/admin/subscribers?view=${view}&paged=${page + 1}`}>Next ›</Link>}
          </div>
        </div>
      )}
    </>
  );
}
