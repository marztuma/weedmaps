import Link from "next/link";
import { desc, sql, eq, and, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { mailStatus } from "@/lib/notify";
import { saveCampaign, sendCampaign, deleteCampaign } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const when = (d) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default async function Campaigns({ searchParams }) {
  const sp = await searchParams;
  const editId = Number(sp?.edit) || null;
  const status = mailStatus();

  const [rows, [audience], editing] = await Promise.all([
    db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.createdAt)).limit(30),
    /* The only number that matters before pressing send: how many rows are
       actually mailable. Subscribed AND with consent recorded — a row missing
       either is excluded here and in the send itself. */
    db.select({ mailable: sql`count(*)`.mapWith(Number) })
      .from(schema.subscribers)
      .where(and(eq(schema.subscribers.status, "subscribed"), isNotNull(schema.subscribers.consentedAt))),
    editId
      ? db.select().from(schema.campaigns).where(eq(schema.campaigns.id, editId)).limit(1).then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <>
      <h1 className="wp-title">Campaigns</h1>
      <Notice
        map={{
          saved: ["is-success", "Draft saved."],
          sent: ["is-success", "Campaign sent. Per-message results are in Email."],
          deleted: ["is-success", "Campaign deleted."],
          no_recipients: ["is-warning", "Nobody is mailable — no subscriber has both an active subscription and recorded consent."],
          not_configured: ["is-warning", "Email is not configured, so nothing was sent."],
          invalid: ["is-error", "A campaign needs a name, a subject and a body."],
        }}
      />

      <p className="wp-subtitle">
        <strong>{audience.mailable}</strong> subscriber{audience.mailable === 1 ? "" : "s"} can receive a
        campaign. Every send goes only to rows that are subscribed <em>and</em> carry a consent
        timestamp, and every message gets a one-click unsubscribe link — that is a legal
        requirement for marketing email, not a courtesy.
      </p>

      {status.usingTestSender && (
        <div className="wp-notice is-warning">
          <p style={{ margin: 0 }}>
            MAIL_FROM is Resend&rsquo;s shared sender, which only delivers to the account&rsquo;s own
            address. A campaign sent now reaches nobody else. Verify a domain first.
          </p>
        </div>
      )}

      <div className="wp-box">
        <div className="wp-box-head">{editing ? `Edit “${editing.name}”` : "New campaign"}</div>
        <div className="wp-box-body">
          <form action={saveCampaign}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="wp-form-row wp-form-row-2">
              <div className="wp-field">
                <label className="wp-label" htmlFor="name">Internal name</label>
                <input id="name" name="name" className="wp-input" required maxLength={120}
                  defaultValue={editing?.name ?? ""} placeholder="October drop" />
                <p className="wp-help">Only you see this.</p>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="subject">Subject line</label>
                <input id="subject" name="subject" className="wp-input" required maxLength={200}
                  defaultValue={editing?.subject ?? ""} placeholder="10% off this weekend" />
              </div>
            </div>
            <div className="wp-field">
              <label className="wp-label" htmlFor="body">Message</label>
              <textarea id="body" name="body" className="wp-input" rows={10} required
                defaultValue={editing?.body ?? ""}
                placeholder={"Plain text. Line breaks are kept.\n\nAn unsubscribe link is added automatically — you do not need to write one."} />
              <p className="wp-help">
                Plain text only, on purpose: it renders everywhere, cannot carry a tracking pixel,
                and is far less likely to be filtered than a wall of markup.
              </p>
            </div>
            <button type="submit" className="wp-btn is-primary">{editing ? "Save draft" : "Create draft"}</button>
            {editing && <Link href="/admin/campaigns" className="wp-btn" style={{ marginLeft: 8 }}>Cancel</Link>}
          </form>
        </div>
      </div>

      <div className="wp-table-wrap" style={{ marginTop: 16 }}>
        <table className="wp-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th style={{ width: 110 }}>Status</th>
              <th style={{ width: 90 }}>Sent</th>
              <th style={{ width: 90 }}>Failed</th>
              <th style={{ width: 170 }}>When</th>
              <th style={{ width: 200 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>No campaigns yet.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="wp-row-title">{c.name}</span>
                  <div className="wp-help">{c.subject}</div>
                </td>
                <td>
                  <span className={`wp-pill ${c.status === "sent" ? "is-green" : c.status === "failed" ? "is-red" : "is-grey"}`}>
                    {c.status}
                  </span>
                </td>
                <td>{c.sentCount}</td>
                <td>{c.failedCount}</td>
                <td className="wp-help">{when(c.sentAt ?? c.createdAt)}</td>
                <td>
                  <div className="wp-row-actions" style={{ visibility: "visible" }}>
                    {c.status === "draft" && (
                      <>
                        <span><Link href={`/admin/campaigns?edit=${c.id}`}>Edit</Link></span>
                        <span>
                          <ConfirmSubmit className="wp-btn-plain" form={`send-${c.id}`}
                            message={`Send “${c.name}” to ${audience.mailable} subscriber(s)? This cannot be recalled.`}>
                            Send now
                          </ConfirmSubmit>
                        </span>
                      </>
                    )}
                    <span>
                      <ConfirmSubmit className="wp-btn-plain is-danger" form={`delc-${c.id}`}
                        message={`Delete “${c.name}”?`}>
                        Delete
                      </ConfirmSubmit>
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.map((c) => (
        <div key={c.id}>
          <form id={`send-${c.id}`} action={sendCampaign} hidden>
            <input type="hidden" name="id" value={c.id} />
          </form>
          <form id={`delc-${c.id}`} action={deleteCampaign} hidden>
            <input type="hidden" name="id" value={c.id} />
          </form>
        </div>
      ))}
    </>
  );
}
