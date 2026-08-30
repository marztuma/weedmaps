import Link from "next/link";
import { sql, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import AdminIcon from "@/components/admin/AdminIcons";
import RevenueChart from "@/components/admin/RevenueChart";

export const dynamic = "force-dynamic";

const { products, brands, categories, shops, customers, orders, auditLog } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

const STATUS_TONE = {
  pending: "is-amber", confirmed: "is-blue", out_for_delivery: "is-blue",
  delivered: "is-green", cancelled: "is-red",
};
const label = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const AGE_TONE = { info: "is-grey", danger: "is-red", money: "is-green" };

/* "1427h ago" is technically true and useless. Switch units once hours stop
   being the way a person would say it. */
function ago(d) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks < 9 ? `${weeks} weeks ago` : `${Math.floor(days / 30)} months ago`;
}

export default async function Dashboard() {
  const [[counts], [rev], recentOrders, stale, revenueDays, activity, topProducts] = await Promise.all([
    db.select({
      products: sql`(select count(*) from ${products})`.mapWith(Number),
      brands: sql`(select count(*) from ${brands})`.mapWith(Number),
      categories: sql`(select count(*) from ${categories})`.mapWith(Number),
      shops: sql`(select count(*) from ${shops})`.mapWith(Number),
      live: sql`(select count(*) from ${shops} where delivering_now)`.mapWith(Number),
      customers: sql`(select count(*) from ${customers})`.mapWith(Number),
      orders: sql`(select count(*) from ${orders})`.mapWith(Number),
      awaiting: sql`(select count(*) from ${orders} where payment_status = 'awaiting_payment')`.mapWith(Number),
      deals: sql`(select count(*) from ${products} where was_price_cents is not null)`.mapWith(Number),
      paused: sql`(select count(*) from ${shops} where not delivering_now)`.mapWith(Number),
      orphanShops: sql`(select count(*) from ${shops} s where not exists (select 1 from ${products} p where p.shop_id = s.id))`.mapWith(Number),
      pendingReviews: sql`(select count(*) from reviews where status = 'pending')`.mapWith(Number),
      mailFailed: sql`(select count(*) from email_log where status in ('failed','bounced') and created_at > now() - interval '7 days')`.mapWith(Number),
      mailSkipped: sql`(select count(*) from email_log where status = 'skipped' and created_at > now() - interval '7 days')`.mapWith(Number),
      lowStock: sql`(select count(*) from ${products} where stock_qty is not null and stock_qty > 0 and stock_qty <= low_stock_at)`.mapWith(Number),
      outOfStock: sql`(select count(*) from ${products} where stock_qty = 0)`.mapWith(Number),
      publishedReviews: sql`(select count(*) from reviews where status = 'published')`.mapWith(Number),
    }).from(sql`(select 1) as t`),

    db.select({
      total: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.paymentStatus} = 'paid'), 0)`.mapWith(Number),
      pipeline: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.paymentStatus} = 'awaiting_payment'), 0)`.mapWith(Number),
      avg: sql`coalesce(avg(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)`.mapWith(Number),
    }).from(orders),

    db.select({
      id: orders.id, reference: orders.reference, status: orders.status,
      paymentStatus: orders.paymentStatus, total: orders.totalCents,
      placedAt: orders.placedAt, customer: customers.name, customerId: customers.id,
    }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.placedAt)).limit(6),

    // orders sitting unpaid for more than a day — the thing that actually costs money
    db.select({
      id: orders.id, reference: orders.reference, total: orders.totalCents,
      placedAt: orders.placedAt, method: orders.paymentMethod, customer: customers.name,
    }).from(orders).innerJoin(customers, eq(orders.customerId, customers.id))
      .where(sql`${orders.paymentStatus} = 'awaiting_payment' and ${orders.placedAt} < now() - interval '24 hours'`)
      .orderBy(orders.placedAt).limit(8),

    db.execute(sql`
      with span as (
        select generate_series(
          (current_date - interval '13 days')::date, current_date, interval '1 day'
        )::date as day
      )
      select span.day,
             coalesce(sum(o.total_cents), 0)::bigint as cents,
             count(o.id)::int as orders
      from span
      left join orders o
        on o.placed_at::date = span.day and o.status <> 'cancelled'
      group by span.day order by span.day`),

    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(8),

    db.execute(sql`
      select p.name, b.name as brand, sum(oi.qty)::int as units,
             sum(oi.unit_price_cents * oi.qty)::bigint as revenue
      from order_items oi
      join products p on p.id = oi.product_id
      join brands b on b.id = p.brand_id
      join orders o on o.id = oi.order_id
      where o.status <> 'cancelled'
      group by p.name, b.name
      order by revenue desc limit 6`),
  ]);

  const dayRows = (revenueDays.rows ?? revenueDays).map((r) => {
    const d = new Date(r.day);
    return {
      day: String(r.day),
      cents: Number(r.cents),
      orders: Number(r.orders),
      label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }),
      short: d.toLocaleDateString("en-US", { day: "numeric" }),
    };
  });

  const top = (topProducts.rows ?? topProducts);

  const tiles = [
    { label: "Products", value: counts.products, href: "/admin/products", icon: "products" },
    { label: "Customers", value: counts.customers, href: "/admin/customers", icon: "customers" },
    { label: "Orders", value: counts.orders, href: "/admin/orders", icon: "orders" },
    { label: "Services delivering", value: `${counts.live}/${counts.shops}`, href: "/admin/deliveries", icon: "delivery" },
  ];

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Dashboard</h1>
      </div>

      {/* What needs a human, before anything else on the page. */}
      {(stale.length > 0 || counts.paused > 0 || counts.orphanShops > 0 || counts.pendingReviews > 0 || counts.outOfStock > 0 || counts.lowStock > 0 || counts.mailFailed > 0 || counts.mailSkipped > 0) && (
        <div className="wp-box">
          <div className="wp-box-head">Needs attention</div>
          <div className="wp-box-body" style={{ display: "grid", gap: 10 }}>
            {counts.mailFailed > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.mailFailed}</strong> email
                {counts.mailFailed === 1 ? "" : "s"} failed or bounced in the last 7 days —
                customers may not have received their order details.{" "}
                <Link href="/admin/email">Check</Link>
              </p>
            )}
            {counts.mailSkipped > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.mailSkipped}</strong> email
                {counts.mailSkipped === 1 ? " was" : "s were"} never attempted because email
                is not configured.{" "}
                <Link href="/admin/email">Configure</Link>
              </p>
            )}
            {counts.outOfStock > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.outOfStock}</strong> product
                {counts.outOfStock === 1 ? " is" : "s are"} out of stock — still listed,
                but customers cannot add them.{" "}
                <Link href="/admin/products?view=out">Restock</Link>
              </p>
            )}
            {counts.lowStock > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.lowStock}</strong> product
                {counts.lowStock === 1 ? " is" : "s are"} at or below their warning level.{" "}
                <Link href="/admin/products?view=low">Review</Link>
              </p>
            )}
            {counts.pendingReviews > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.pendingReviews}</strong> review
                {counts.pendingReviews === 1 ? " is" : "s are"} waiting to be checked — nobody
                sees them until they are published.{" "}
                <Link href="/admin/reviews?status=pending">Moderate</Link>
              </p>
            )}
            {stale.length > 0 && (
              <div className="wp-notice is-warning" style={{ margin: 0 }}>
                <p style={{ marginBottom: 6 }}>
                  <strong>{stale.length} order{stale.length === 1 ? "" : "s"} unpaid for over 24 hours</strong>{" "}
                  — {money(stale.reduce((n, o) => n + o.total, 0))} of stock is held against payments that never landed.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {stale.slice(0, 4).map((o) => (
                    <li key={o.id}>
                      <Link href="/admin/orders?pay=awaiting_payment">{o.reference}</Link>
                      {" · "}{o.customer} · {money(o.total)} · {ago(o.placedAt)}
                    </li>
                  ))}
                </ul>
                {stale.length > 4 && (
                  <p style={{ marginTop: 6 }}>
                    <Link href="/admin/orders?pay=awaiting_payment">See all {stale.length}</Link>
                  </p>
                )}
              </div>
            )}
            {counts.paused > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.paused}</strong> delivery service{counts.paused === 1 ? " is" : "s are"} paused —
                their products are hidden from the storefront.{" "}
                <Link href="/admin/deliveries">Review</Link>
              </p>
            )}
            {counts.orphanShops > 0 && (
              <p style={{ margin: 0 }}>
                <strong>{counts.orphanShops}</strong> service{counts.orphanShops === 1 ? " has" : "s have"} no products —
                customers can find them with an empty menu.{" "}
                <Link href="/admin/products/new">Add stock</Link>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="wp-grid wp-grid-4" style={{ marginBottom: 20 }}>
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="wp-box" style={{ display: "block", marginBottom: 0, textDecoration: "none", color: "inherit" }}>
            <div className="wp-box-body" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AdminIcon name={t.icon} size={26} style={{ color: "var(--wp-blue)", flex: "0 0 auto" }} />
              <span className="wp-stat" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                <span className="wp-stat-num">{t.value}</span>
                <span className="wp-stat-label">{t.label}</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="wp-grid wp-grid-2">
        <div>
          <div className="wp-box">
            <div className="wp-box-head">Revenue, last 14 days</div>
            <div className="wp-box-body">
              <RevenueChart days={dayRows} />
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-head">Money</div>
            <div className="wp-box-body" style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                ["Confirmed paid", money(rev.total)],
                ["Awaiting payment", money(rev.pipeline)],
                ["Average order", money(Math.round(rev.avg))],
              ].map(([k, v]) => (
                <span key={k} className="wp-stat" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
                  <span className="wp-stat-num">{v}</span>
                  <span className="wp-stat-label">{k}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-head">Best sellers by revenue</div>
            <div className="wp-box-body" style={{ padding: 0 }}>
              <table className="wp-table">
                <thead><tr><th>Product</th><th className="col-num">Units</th><th className="col-num">Revenue</th></tr></thead>
                <tbody>
                  {top.length === 0 && <tr><td colSpan={3} className="wp-help" style={{ padding: 16 }}>No orders yet.</td></tr>}
                  {top.map((p) => (
                    <tr key={`${p.brand}-${p.name}`}>
                      <td>{p.name}<div className="wp-help">{p.brand}</div></td>
                      <td className="col-num">{p.units}</td>
                      <td className="col-num">{money(Number(p.revenue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="wp-box">
            <div className="wp-box-head">
              At a Glance
              <Link href="/admin/products/new" style={{ fontWeight: 400, fontSize: 13 }}>Add product</Link>
            </div>
            <div className="wp-box-body">
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
                <li><Link href="/admin/products">{counts.products} products</Link> across <Link href="/admin/categories">{counts.categories} categories</Link> and <Link href="/admin/brands">{counts.brands} brands</Link></li>
                <li><strong>{counts.deals}</strong> products currently discounted</li>
                <li><Link href="/admin/orders?pay=awaiting_payment">{counts.awaiting} orders awaiting payment</Link></li>
              </ul>
              <p className="wp-help" style={{ marginTop: 12 }}>
                Delivery only — there is no pickup anywhere in this product.
              </p>
            <p>
              <Link href="/admin/reviews?status=published">{counts.publishedReviews} published review{counts.publishedReviews === 1 ? "" : "s"}</Link>
              {counts.pendingReviews > 0 ? `, ${counts.pendingReviews} awaiting moderation` : ""}
            </p>
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-head">
              Recent Orders
              <Link href="/admin/orders" style={{ fontWeight: 400, fontSize: 13 }}>View all</Link>
            </div>
            <div className="wp-box-body" style={{ padding: 0 }}>
              <table className="wp-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="col-num">Total</th></tr></thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href="/admin/orders">{o.reference}</Link>
                        {o.paymentStatus === "awaiting_payment" && (
                          <div><span className="wp-pill is-amber">Unpaid</span></div>
                        )}
                      </td>
                      <td><Link href={`/admin/customers/${o.customerId}`}>{o.customer}</Link></td>
                      <td><span className={`wp-pill ${STATUS_TONE[o.status] ?? "is-grey"}`}>{label(o.status)}</span></td>
                      <td className="col-num">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="wp-box">
            <div className="wp-box-head">
              Activity
              <Link href="/admin/activity" style={{ fontWeight: 400, fontSize: 13 }}>Full log</Link>
            </div>
            <div className="wp-box-body">
              {activity.length === 0 ? (
                <p className="wp-help" style={{ margin: 0 }}>
                  Nothing recorded yet. Deletions, payment confirmations and wallet changes appear here.
                </p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                  {activity.map((a) => (
                    <li key={a.id}>
                      <span className={`wp-pill ${AGE_TONE[a.severity] ?? "is-grey"}`}>{a.action.replace(/_/g, " ")}</span>{" "}
                      {a.summary}
                      <div className="wp-help">
                        {a.actor} · {new Date(a.createdAt).toLocaleString("en-US")}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
