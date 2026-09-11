import Link from "next/link";
import { sql, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import AdminIcon from "@/components/admin/AdminIcons";
import RevenueChart from "@/components/admin/RevenueChart";
import DashboardCard from "@/components/admin/DashboardCard";
import DonutChart from "@/components/admin/DonutChart";

export const dynamic = "force-dynamic";

const { products, brands, categories, shops, customers, orders, auditLog } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

const STATUS_TONE = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  out_for_delivery: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const label = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

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
  const [[counts], [rev], recentOrders, revenueDays, topProducts, activity, categories] = await Promise.all([
    db.select({
      products: sql`(select count(*) from ${products})`.mapWith(Number),
      customers: sql`(select count(*) from ${customers})`.mapWith(Number),
      orders: sql`(select count(*) from ${orders})`.mapWith(Number),
      shops: sql`(select count(*) from ${shops})`.mapWith(Number),
      subscribers: sql`(select count(*) from subscribers where status = 'subscribed')`.mapWith(Number),
      pendingReviews: sql`(select count(*) from reviews where status = 'pending')`.mapWith(Number),
    }).from(sql`(select 1) as t`),

    db.select({
      total: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.paymentStatus} = 'paid'), 0)`.mapWith(Number),
      avg: sql`coalesce(avg(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)`.mapWith(Number),
    }).from(orders),

    db.select({
      id: orders.id,
      reference: orders.reference,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      total: orders.totalCents,
      placedAt: orders.placedAt,
      customer: customers.name,
      customerId: customers.id,
    }).from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.placedAt))
      .limit(5),

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

    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(6),

    db.execute(sql`
      select c.name, count(p.id)::int as product_count,
             count(distinct o.id)::int as order_count
      from categories c
      left join products p on p.category_id = c.id
      left join order_items oi on oi.product_id = p.id
      left join orders o on o.id = oi.order_id
      group by c.name
      order by order_count desc limit 5`),
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
  const activityLog = activity.rows ?? activity;
  const categoryData = (categories.rows ?? categories).map(c => ({
    label: c.name,
    value: c.order_count || 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 mb-2">Welcome back</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-1">Here's your business overview</h1>
        <p className="text-gray-500">Track your sales, users and growth in real-time.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          label="Total Revenue"
          value={money(rev.total)}
          change="+12.5%"
          trend="up"
        />
        <DashboardCard
          label="Total Customers"
          value={counts.customers.toLocaleString()}
          change="+8.2%"
          trend="up"
        />
        <DashboardCard
          label="Total Orders"
          value={counts.orders.toLocaleString()}
          change="+14.6%"
          trend="up"
        />
        <DashboardCard
          label="Avg Order Value"
          value={money(Math.round(rev.avg))}
          change="+0.9%"
          trend="up"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <p className="text-sm text-gray-500 mt-1">+28.4% from last period</p>
          </div>
          <RevenueChart days={dayRows} />
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sales by Category</h2>
          {top.length > 0 ? (
            <DonutChart
              data={top.slice(0, 4).map((p) => ({
                label: p.brand,
                value: Number(p.revenue),
              }))}
              total={top.slice(0, 4).reduce((sum, p) => sum + Number(p.revenue), 0)}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href="/admin/orders" className="text-blue-600 hover:text-blue-700 font-medium">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{o.customer}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_TONE[o.status] || "bg-gray-100 text-gray-700"}`}>
                      {label(o.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Sellers & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Best Sellers by Revenue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Units</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {top.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No sales yet
                    </td>
                  </tr>
                ) : (
                  top.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.brand}</p>
                      </td>
                      <td className="px-6 py-3 text-right text-gray-900">{p.units}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900">{money(Number(p.revenue))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Orders by Category</h2>
          </div>
          <div className="p-6">
            {categoryData.length > 0 ? (
              <div className="space-y-3">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-3 h-3 rounded-full" style={{
                        backgroundColor: ["#4f46e5", "#8b5cf6", "#06b6d4", "#f59e0b", "#6366f1"][idx % 5]
                      }} />
                      <span className="text-gray-700">{cat.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{cat.value} orders</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No category data</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity & Audience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/admin/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Full log
            </Link>
          </div>
          <div className="p-6">
            {activityLog.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No activity recorded yet</p>
            ) : (
              <ul className="space-y-3">
                {activityLog.map((a) => (
                  <li key={a.id} className="pb-3 border-b border-gray-200 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.action.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-600 mt-1">{a.summary}</p>
                        <p className="text-xs text-gray-500 mt-1">{a.actor} · {ago(a.createdAt)}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        a.severity === "danger" ? "bg-red-100 text-red-800" :
                        a.severity === "money" ? "bg-green-100 text-green-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {a.severity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">At a Glance</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-700">Email Subscribers</span>
              <span className="text-2xl font-bold text-gray-900">{counts.subscribers.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-700">Pending Reviews</span>
              <span className="text-2xl font-bold text-gray-900">{counts.pendingReviews}</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-gray-700">Active Delivery Services</span>
              <span className="text-2xl font-bold text-gray-900">{counts.shops}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Categories</span>
              <span className="text-2xl font-bold text-gray-900">{categoryData.length}</span>
            </div>

            <div className="pt-4 space-y-2">
              {counts.pendingReviews > 0 && (
                <Link href="/admin/reviews?status=pending" className="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                  → Moderate pending reviews
                </Link>
              )}
              <Link href="/admin/subscribers" className="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                → Manage subscribers
              </Link>
              <Link href="/admin/products/new" className="block text-sm text-blue-600 hover:text-blue-700 font-medium">
                → Add new product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
