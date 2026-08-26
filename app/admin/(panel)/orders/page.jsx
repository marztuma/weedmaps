import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { setOrderStatus, confirmPayment, bulkOrderAction } from "../../actions";
import Notice from "@/components/admin/Notice";
import BulkForm, { SelectAllToggle, BulkCheckbox } from "@/components/admin/BulkForm";
import StatusSelect from "@/components/admin/StatusSelect";
import PaymentConfirm from "@/components/admin/PaymentConfirm";

export const dynamic = "force-dynamic";

const { orders, orderItems, customers, shops, paymentMethods } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;
const when = (d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

export const STATUSES = [
  { value: "pending", label: "Pending", tone: "is-amber" },
  { value: "confirmed", label: "Confirmed", tone: "is-blue" },
  { value: "out_for_delivery", label: "Out for delivery", tone: "is-blue" },
  { value: "delivered", label: "Delivered", tone: "is-green" },
  { value: "cancelled", label: "Cancelled", tone: "is-red" },
];

const PAY_TONE = {
  awaiting_payment: "is-amber", paid: "is-green", failed: "is-red", refunded: "is-grey",
};
const BULK_ACTIONS = [
  {
    value: "delete", label: "Delete permanently", danger: true,
    confirm: "Delete {n}?\n\nThe order lines go with them. This cannot be undone.",
  },
  { value: "cancel", label: "Cancel order" },
  { value: "mark_delivered", label: "Mark delivered" },
];

const PAY_LABEL = {
  awaiting_payment: "Awaiting payment", paid: "Paid", failed: "Failed", refunded: "Refunded",
};

export default async function OrdersAdmin({ searchParams }) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const pay = typeof sp.pay === "string" ? sp.pay : "";

  const where = [];
  if (status) where.push(eq(orders.status, status));
  if (pay) where.push(eq(orders.paymentStatus, pay));
  const clause = where.length ? and(...where) : undefined;

  const [rows, counts, [totals], payCounts, methods] = await Promise.all([
    db.select({
      id: orders.id, reference: orders.reference, status: orders.status,
      subtotal: orders.subtotalCents, fee: orders.deliveryFeeCents, total: orders.totalCents,
      placedAt: orders.placedAt,
      paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus,
      paymentReference: orders.paymentReference,
      paymentConfirmedBy: orders.paymentConfirmedBy,
      destination: orders.paymentDestination,
      contactEmail: orders.contactEmail, deliveryAddress: orders.deliveryAddress,
      customerId: customers.id, customer: customers.name, email: customers.email,
      shop: shops.name,
      items: sql`count(${orderItems.id})`.mapWith(Number),
    }).from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(clause)
      .groupBy(orders.id, customers.id, shops.name)
      .orderBy(desc(orders.placedAt))
      .limit(100),
    db.select({ status: orders.status, n: sql`count(*)`.mapWith(Number) }).from(orders).groupBy(orders.status),
    db.select({
      gross: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)`.mapWith(Number),
      n: sql`count(*)`.mapWith(Number),
      awaiting: sql`count(*) filter (where ${orders.paymentStatus} = 'awaiting_payment')`.mapWith(Number),
    }).from(orders),
    db.select({ pay: orders.paymentStatus, n: sql`count(*)`.mapWith(Number) }).from(orders).groupBy(orders.paymentStatus),
    db.select({ code: paymentMethods.code, label: paymentMethods.label }).from(paymentMethods),
  ]);

  const methodLabel = new Map(methods.map((m) => [m.code, m.label]));
  const countFor = (v) => counts.find((c) => c.status === v)?.n ?? 0;
  const payCountFor = (v) => payCounts.find((c) => c.pay === v)?.n ?? 0;

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Orders</h1>
        <a href="/admin/export?kind=orders" className="wp-btn">Export CSV</a>
        <span className="wp-subtitle">{totals.n} orders · {money(totals.gross)} gross</span>
      </div>

      <Notice
        map={{
          bulk_deleted: ["is-success", "Selected orders deleted."],
          bulk_cancelled: ["is-success", "Selected orders cancelled."],
          bulk_delivered: ["is-success", "Selected orders marked delivered."],
          bulk_none: ["is-warning", "Nothing happened — pick an action and tick at least one row."],
        }}
      />

      {totals.awaiting > 0 && (
        <div className="wp-notice is-warning">
          <p>
            <strong>{totals.awaiting} order{totals.awaiting === 1 ? "" : "s"} awaiting payment.</strong>{" "}
            Verify the funds actually arrived in your wallet or account before marking any of
            them paid — nothing here is confirmed automatically.{" "}
            <Link href="/admin/orders?pay=awaiting_payment">Show them</Link>.
          </p>
        </div>
      )}

      <ul className="wp-subsubsub">
        <li><Link href="/admin/orders" className={!status && !pay ? "is-current" : ""}>All <span>({totals.n})</span></Link></li>
        {Object.entries(PAY_LABEL).map(([v, l]) => (
          <li key={v}>
            <Link href={`/admin/orders?pay=${v}`} className={pay === v ? "is-current" : ""}>
              {l} <span>({payCountFor(v)})</span>
            </Link>
          </li>
        ))}
      </ul>

      <ul className="wp-subsubsub">
        {STATUSES.map((s) => (
          <li key={s.value}>
            <Link href={`/admin/orders?status=${s.value}`} className={status === s.value ? "is-current" : ""}>
              {s.label} <span>({countFor(s.value)})</span>
            </Link>
          </li>
        ))}
      </ul>

      <BulkForm action={bulkOrderAction} actions={BULK_ACTIONS} itemLabel="order" total={rows.length}>
      <div className="wp-table-wrap">
        <table className="wp-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}><SelectAllToggle label="Select all orders" /></th>
              <th>Order</th><th>Customer</th><th>Payment</th>
              <th style={{ width: 200 }}>Fulfilment</th>
              <th className="col-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 24, textAlign: "center" }}>
                No orders match. <Link href="/admin/orders">Show all</Link>.
              </td></tr>
            )}
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <BulkCheckbox id={o.id} label={`Select order ${o.reference}`} />
                </td>
                <td>
                  <strong>{o.reference}</strong>
                  <div className="wp-help">{when(o.placedAt)} · {o.items} item{o.items === 1 ? "" : "s"}</div>
                  <div className="wp-help">{o.shop ?? "—"}</div>
                </td>
                <td>
                  <Link href={`/admin/customers/${o.customerId}`}>{o.customer}</Link>
                  <div className="wp-help">{o.contactEmail ?? o.email}</div>
                  {o.deliveryAddress && <div className="wp-help">{o.deliveryAddress}</div>}
                </td>
                <td style={{ minWidth: 260 }}>
                  <span className={`wp-pill ${PAY_TONE[o.paymentStatus] ?? "is-grey"}`}>
                    {PAY_LABEL[o.paymentStatus] ?? o.paymentStatus}
                  </span>
                  <div className="wp-help" style={{ marginTop: 4 }}>
                    {o.paymentMethod ? (methodLabel.get(o.paymentMethod) ?? o.paymentMethod) : "—"}
                  </div>
                  {o.paymentConfirmedBy && (
                    <div className="wp-help">Confirmed by {o.paymentConfirmedBy}</div>
                  )}
                  {o.paymentReference && (
                    <div className="wp-help">Ref: {o.paymentReference}</div>
                  )}
                  <PaymentConfirm
                    action={confirmPayment}
                    id={o.id}
                    reference={o.reference}
                    total={money(o.total)}
                    current={o.paymentStatus}
                  />
                </td>
                <td>
                  <StatusSelect action={setOrderStatus} id={o.id} value={o.status} options={STATUSES} />
                </td>
                <td className="col-num">
                  {money(o.total)}
                  <div className="wp-help">{o.fee === 0 ? "Free delivery" : `+${money(o.fee)} fee`}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </BulkForm>
    </>
  );
}
