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
  const [[counts], [rev], recentOrders, revenueDays, topProducts] = await Promise.all([
    db.select({
      products: sql`(select count(*) from ${products})`.mapWith(Number),
      customers: sql`(select count(*) from ${customers})`.mapWith(Number),
      orders: sql`(select count(*) from ${orders})`.mapWith(Number),
      shops: sql`(select count(*) from ${shops})`.mapWith(Number),
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Products", href: "/admin/products", count: counts.products },
          { label: "Customers", href: "/admin/customers", count: counts.customers },
          { label: "Orders", href: "/admin/orders", count: counts.orders },
          { label: "Brands", href: "/admin/brands", count: counts.brands ?? 0 },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <p className="text-2xl font-bold text-gray-900">{item.count.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
