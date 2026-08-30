import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { mailStatus } from "@/lib/notify";
import { restrictedRecipient } from "@/lib/mail/send";
import { maskEmail } from "@/lib/mail/safe";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { sendTestEmail, unsuppressAddress } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 40;

const TONE = {
  delivered: "is-green", sent: "is-blue", queued: "is-grey",
  bounced: "is-red", complained: "is-red", failed: "is-red",
  suppressed: "is-amber", skipped: "is-grey",
};

const when = (d) =>
  d ? new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  }) : "—";

export default async function EmailAdmin({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp?.paged) || 1);

  const status = mailStatus();

  const [rows, [counts], suppressions] = await Promise.all([
    db.select().from(schema.emailLog)
      .orderBy(desc(schema.emailLog.createdAt))
      .limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({
      total: sql`count(*)`.mapWith(Number),
      failed: sql`count(*) filter (where status in ('failed','bounced','complained'))`.mapWith(Number),
      delivered: sql`count(*) filter (where status = 'delivered')`.mapWith(Number),
      skipped: sql`count(*) filter (where status = 'skipped')`.mapWith(Number),
    }).from(schema.emailLog),
    db.select().from(schema.emailSuppressions).orderBy(desc(schema.emailSuppressions.createdAt)).limit(25),
  ]);

  const pages = Math.max(1, Math.ceil(counts.total / PER_PAGE));

  /* If sending is being refused because of the shared-sender restriction, the
     provider has already told us which address it will accept. Surface that
     instead of making someone read the error column and work it out. */
  const restrictedTo = rows.map((r) => restrictedRecipient(r.error)).find(Boolean) ?? null;

  /* Can an admin alert actually land? On the shared sender that is true only
     when ADMIN_EMAIL is the account's own address. With no restriction on
     record we have nothing to contradict, so assume it can. */
  const alertsDeliverable = !restrictedTo || status.adminEmail === restrictedTo;

  return (
    <>
      <h1 className="wp-title">Email</h1>
      <Notice
        map={{
          test_sent: ["is-success", "Test email sent. Check the inbox for ADMIN_EMAIL."],
          test_failed: ["is-error", "Test send failed — see the most recent row below for the reason."],
          not_configured: ["is-warning", "Email is not configured, so nothing was sent."],
          unsuppressed: ["is-success", "Address removed from the suppression list."],
        }}
      />

      <div className="wp-box">
        <div className="wp-box-head">Configuration</div>
        <div className="wp-box-body">
          {status.configured && status.usingTestSender ? (
            <div className="wp-notice is-warning" style={{ margin: 0 }}>
              {alertsDeliverable ? (
                <>
                  <p style={{ marginTop: 0 }}>
                    <strong>Admin alerts are working. Customers cannot be reached yet.</strong>{" "}
                    MAIL_FROM is Resend&rsquo;s shared sender, which anyone may use without owning a
                    domain. It delivers only to the address the Resend account is registered under,
                    and ADMIN_EMAIL is that address — so orders and reviews reach you, and nothing
                    reaches a customer.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    Order confirmations and payment receipts are built and tested, and will stay
                    unsent until a domain is verified at resend.com/domains and MAIL_FROM points at
                    an address on it.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ marginTop: 0 }}>
                    <strong>Nothing is being delivered.</strong> MAIL_FROM is Resend&rsquo;s shared
                    sender, which delivers only to the address the Resend account is registered
                    under
                    {restrictedTo ? <> — <strong>{restrictedTo}</strong></> : null}. Admin alerts
                    are addressed to <strong>{status.adminEmail ?? "nowhere"}</strong>, so every one
                    is refused.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    Either point ADMIN_EMAIL at{" "}
                    {restrictedTo ? <strong>{restrictedTo}</strong> : "the Resend account address"} to
                    get alerts today, or add a domain at resend.com/domains — the latter is the only
                    thing that also lets <em>customers</em> receive order confirmations.
                  </p>
                </>
              )}
            </div>
          ) : status.configured ? (
            <p className="wp-notice is-success" style={{ margin: 0 }}>
              Email is configured. Sending as <strong>{status.from}</strong>.
            </p>
          ) : (
            <p className="wp-notice is-warning" style={{ margin: 0 }}>
              Email is not configured. Orders and reviews still record normally in the
              admin — nothing is lost — but nobody is told by email.
              {!status.hasKey && " RESEND_API_KEY is not set."}
              {!status.from && " MAIL_FROM is not set."}
            </p>
          )}

          <table className="wp-table" style={{ marginTop: 12 }}>
            <tbody>
              <tr><td>API key</td><td>{status.hasKey ? "set" : <span className="wp-pill is-red">missing</span>}</td></tr>
              <tr>
                <td>From address</td>
                <td>
                  {status.from ?? <span className="wp-pill is-red">missing</span>}
                  {status.usingTestSender && (
                    <span className="wp-pill is-amber" style={{ marginLeft: 8 }}>
                      shared test sender — cannot reach customers
                    </span>
                  )}
                </td>
              </tr>
              <tr><td>Admin recipient</td><td>{status.adminEmail ?? <span className="wp-pill is-amber">missing — admin alerts cannot be sent</span>}</td></tr>
              <tr>
                <td>Delivery webhook</td>
                <td>
                  {status.webhookReady
                    ? "signing secret set"
                    : <span className="wp-pill is-amber">no secret — delivery and bounce reporting is off</span>}
                </td>
              </tr>
            </tbody>
          </table>

          <form action={sendTestEmail} style={{ marginTop: 12 }}>
            <button type="submit" className="wp-btn" disabled={!status.configured || !status.adminEmail}>
              Send a test email
            </button>
            <span className="wp-help" style={{ marginLeft: 10 }}>
              Goes to ADMIN_EMAIL only. Never to an address typed into the site.
            </span>
          </form>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">
          Recent sends — {counts.total} total, {counts.delivered} delivered, {counts.failed} failed, {counts.skipped} skipped
        </div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th style={{ width: 150 }}>When</th>
                <th style={{ width: 150 }}>Template</th>
                <th>To</th>
                <th>Subject</th>
                <th style={{ width: 110 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                  Nothing sent yet.
                </td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="wp-help">{when(r.createdAt)}</td>
                  <td>{r.template}</td>
                  {/* Masked: enough to recognise the customer, not enough to
                      harvest the list off a shared screen. */}
                  <td title="Address is masked on this screen">{maskEmail(r.recipient)}</td>
                  <td>
                    {r.subject}
                    {r.error && <div className="wp-help is-danger">{r.error}</div>}
                  </td>
                  <td><span className={`wp-pill ${TONE[r.status] ?? "is-grey"}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="wp-tablenav">
            <span className="wp-subtitle">Page {page} of {pages}</span>
            <div className="wp-tablenav-links">
              {page > 1 && <Link className="wp-btn" href={`/admin/email?paged=${page - 1}`}>‹ Previous</Link>}
              {page < pages && <Link className="wp-btn" href={`/admin/email?paged=${page + 1}`}>Next ›</Link>}
            </div>
          </div>
        )}
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Suppressed addresses</div>
        <div className="wp-box-body">
          <p className="wp-help" style={{ marginTop: 0 }}>
            Written automatically when an address hard-bounces or someone marks a message
            as spam. Nothing is sent to these again. Continuing to mail them is how a
            sending domain loses its reputation, so remove one only if you know the
            address is good.
          </p>
        </div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr><th>Address</th><th style={{ width: 130 }}>Reason</th><th>Detail</th><th style={{ width: 110 }} /></tr>
            </thead>
            <tbody>
              {suppressions.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: "center" }}>None.</td></tr>
              )}
              {suppressions.map((s) => (
                <tr key={s.id}>
                  <td>{maskEmail(s.email)}</td>
                  <td><span className="wp-pill is-red">{s.reason}</span></td>
                  <td className="wp-help">{s.detail ?? "—"}</td>
                  <td>
                    <ConfirmSubmit
                      className="wp-btn-plain"
                      form={`unsup-${s.id}`}
                      message="Remove this address from the suppression list? Only do this if you know it is deliverable."
                    >
                      Remove
                    </ConfirmSubmit>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {suppressions.map((s) => (
          <form key={s.id} id={`unsup-${s.id}`} action={unsuppressAddress} hidden>
            <input type="hidden" name="id" value={s.id} />
          </form>
        ))}
      </div>
    </>
  );
}
