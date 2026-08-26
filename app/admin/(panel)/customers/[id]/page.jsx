import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { addNote } from "../../../actions";
import NoteForm from "@/components/admin/NoteForm";
import { STAGES } from "../page";

export const dynamic = "force-dynamic";

const { customers, orders, orderItems, customerNotes, shops } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—");

const STATUS_TONE = {
  pending: "is-amber", confirmed: "is-blue", out_for_delivery: "is-blue",
  delivered: "is-green", cancelled: "is-red",
};
const label = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default async function CustomerDetail({ params }) {
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isFinite(customerId)) notFound();

  const [[customer], orderRows, notes] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, customerId)).limit(1),
    db.select({
      id: orders.id, reference: orders.reference, status: orders.status,
      total: orders.totalCents, fee: orders.deliveryFeeCents,
      placedAt: orders.placedAt, shop: shops.name,
      items: sql`count(${orderItems.id})`.mapWith(Number),
    }).from(orders)
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(eq(orders.customerId, customerId))
      .groupBy(orders.id, shops.name)
      .orderBy(desc(orders.placedAt)),
    db.select().from(customerNotes)
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt)),
  ]);

  if (!customer) notFound();

  const stage = STAGES.find((s) => s.value === customer.stage) ?? STAGES[0];
  const spend = orderRows.filter((o) => o.status !== "cancelled").reduce((n, o) => n + o.total, 0);
  const aov = orderRows.length ? Math.round(spend / orderRows.length) : 0;

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">{customer.name}</h1>
        <span className={`wp-pill ${stage.tone}`}>{stage.label}</span>
        <Link href={`/admin/customers?edit=${customer.id}`} className="wp-btn">Edit</Link>
        <Link href="/admin/customers" className="wp-btn">Back to Customers</Link>
      </div>

      <div className="wp-grid wp-grid-4" style={{ marginBottom: 20 }}>
        {[
          ["Lifetime spend", money(spend)],
          ["Orders", orderRows.length],
          ["Average order", money(aov)],
          ["Customer since", when(customer.createdAt)],
        ].map(([k, v]) => (
          <div key={k} className="wp-box" style={{ marginBottom: 0 }}>
            <div className="wp-box-body">
              <span className="wp-stat" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                <span className="wp-stat-num">{v}</span>
                <span className="wp-stat-label">{k}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="wp-grid wp-grid-2">
        <div>
          <div className="wp-box">
            <div className="wp-box-head">Contact</div>
            <div className="wp-box-body">
              <table className="wp-table" style={{ border: 0 }}>
                <tbody>
                  <tr><td style={{ width: 130, color: "var(--wp-text-soft)" }}>Email</td><td><a href={`mailto:${customer.email}`}>{customer.email}</a></td></tr>
                  <tr><td style={{ color: "var(--wp-text-soft)" }}>Phone</td><td>{customer.phone ?? "—"}</td></tr>
                  <tr><td style={{ color: "var(--wp-text-soft)" }}>Delivers to</td><td>{customer.address ?? "—"}{customer.city ? `, ${customer.city}` : ""}</td></tr>
                  <tr>
                    <td style={{ color: "var(--wp-text-soft)" }}>Age check</td>
                    <td>
                      <span className={`wp-pill ${customer.ageVerified ? "is-green" : "is-red"}`}>
                        {customer.ageVerified ? "Verified 21+" : "Not verified"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--wp-text-soft)" }}>Marketing</td>
                    <td>{customer.marketingOptIn ? "Opted in" : "Opted out"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "var(--wp-text-soft)" }}>Tags</td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(customer.tags ?? []).length === 0 && "—"}
                        {(customer.tags ?? []).map((t) => <span key={t} className="wp-pill is-grey">{t}</span>)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              {customer.notes && (
                <>
                  <p className="wp-label" style={{ marginTop: 12 }}>Internal notes</p>
                  <p style={{ margin: 0 }}>{customer.notes}</p>
                </>
              )}
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-head">Activity</div>
            <div className="wp-box-body">
              <NoteForm action={addNote} customerId={customer.id} />

              <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0, display: "grid", gap: 12 }}>
                {notes.length === 0 && <li className="wp-help">No notes yet.</li>}
                {notes.map((n) => (
                  <li key={n.id} style={{ borderBottom: "1px solid var(--wp-border-soft)", paddingBottom: 12 }}>
                    <p style={{ margin: 0 }}>{n.body}</p>
                    <p className="wp-help" style={{ marginTop: 3 }}>
                      {n.authorName} · {when(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="wp-box">
          <div className="wp-box-head">Order History</div>
          <div className="wp-box-body" style={{ padding: 0 }}>
            <table className="wp-table">
              <thead>
                <tr><th>Order</th><th>Service</th><th>Status</th><th className="col-num">Total</th></tr>
              </thead>
              <tbody>
                {orderRows.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 20, textAlign: "center" }} className="wp-help">
                    No orders yet — still a lead.
                  </td></tr>
                )}
                {orderRows.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.reference}</strong>
                      <div className="wp-help">{when(o.placedAt)} · {o.items} item{o.items === 1 ? "" : "s"}</div>
                    </td>
                    <td>{o.shop ?? "—"}</td>
                    <td><span className={`wp-pill ${STATUS_TONE[o.status] ?? "is-grey"}`}>{label(o.status)}</span></td>
                    <td className="col-num">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
