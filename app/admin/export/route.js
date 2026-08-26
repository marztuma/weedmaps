import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const { customers, orders, orderItems, shops, products, brands } = schema;

/* CSV export. Quotes every field and doubles internal quotes, so a customer
   called O'Brien or an address with a comma cannot break the file — and a value
   starting with = + - @ is prefixed, because spreadsheets execute those. */
function csv(rows, headers) {
  const cell = (v) => {
    if (v == null) return '""';
    let s = String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = headers.map((h) => cell(h.label)).join(",");
  const body = rows.map((r) => headers.map((h) => cell(h.get(r))).join(",")).join("\r\n");
  return `${head}\r\n${body}\r\n`;
}

const money = (c) => ((c ?? 0) / 100).toFixed(2);
const iso = (d) => (d ? new Date(d).toISOString() : "");

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const kind = new URL(request.url).searchParams.get("kind") ?? "customers";
  const stamp = new Date().toISOString().slice(0, 10);
  let body, filename, count;

  if (kind === "orders") {
    const rows = await db.select({
      reference: orders.reference, placedAt: orders.placedAt,
      status: orders.status, paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod, paymentReference: orders.paymentReference,
      subtotal: orders.subtotalCents, fee: orders.deliveryFeeCents, total: orders.totalCents,
      customer: customers.name, email: orders.contactEmail, phone: orders.contactPhone,
      address: orders.deliveryAddress, service: shops.name,
      items: sql`count(${orderItems.id})`.mapWith(Number),
    })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(shops, eq(orders.shopId, shops.id))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .groupBy(orders.id, customers.name, shops.name)
      .orderBy(desc(orders.placedAt));

    count = rows.length;
    body = csv(rows, [
      { label: "Reference", get: (r) => r.reference },
      { label: "Placed", get: (r) => iso(r.placedAt) },
      { label: "Status", get: (r) => r.status },
      { label: "Payment status", get: (r) => r.paymentStatus },
      { label: "Payment method", get: (r) => r.paymentMethod },
      { label: "Payment reference", get: (r) => r.paymentReference },
      { label: "Customer", get: (r) => r.customer },
      { label: "Email", get: (r) => r.email },
      { label: "Phone", get: (r) => r.phone },
      { label: "Delivery address", get: (r) => r.address },
      { label: "Service", get: (r) => r.service },
      { label: "Items", get: (r) => r.items },
      { label: "Subtotal", get: (r) => money(r.subtotal) },
      { label: "Delivery fee", get: (r) => money(r.fee) },
      { label: "Total", get: (r) => money(r.total) },
    ]);
    filename = `weedmaps-orders-${stamp}.csv`;
  } else if (kind === "products") {
    const rows = await db.select({
      name: products.name, brand: brands.name, price: products.priceCents,
      was: products.wasPriceCents, weight: products.weight, thc: products.thc,
      cbd: products.cbd, type: products.strainType, service: shops.name,
      live: shops.deliveringNow, slug: products.slug,
    })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(shops, eq(products.shopId, shops.id))
      .orderBy(products.name);

    count = rows.length;
    body = csv(rows, [
      { label: "Product", get: (r) => r.name },
      { label: "Brand", get: (r) => r.brand },
      { label: "Price", get: (r) => money(r.price) },
      { label: "Was", get: (r) => (r.was ? money(r.was) : "") },
      { label: "Weight", get: (r) => r.weight },
      { label: "THC %", get: (r) => r.thc },
      { label: "CBD %", get: (r) => r.cbd },
      { label: "Strain", get: (r) => r.type },
      { label: "Delivered by", get: (r) => r.service },
      { label: "Service live", get: (r) => (r.live ? "yes" : "no") },
      { label: "Slug", get: (r) => r.slug },
    ]);
    filename = `weedmaps-products-${stamp}.csv`;
  } else {
    const rows = await db.select({
      name: customers.name, email: customers.email, phone: customers.phone,
      address: customers.address, city: customers.city, stage: customers.stage,
      tags: customers.tags, ageVerified: customers.ageVerified,
      marketingOptIn: customers.marketingOptIn, createdAt: customers.createdAt,
      orderCount: sql`count(${orders.id})`.mapWith(Number),
      spend: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)`.mapWith(Number),
    })
      .from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .groupBy(customers.id)
      .orderBy(customers.name);

    count = rows.length;
    body = csv(rows, [
      { label: "Name", get: (r) => r.name },
      { label: "Email", get: (r) => r.email },
      { label: "Phone", get: (r) => r.phone },
      { label: "Address", get: (r) => r.address },
      { label: "Area", get: (r) => r.city },
      { label: "Stage", get: (r) => r.stage },
      { label: "Tags", get: (r) => (r.tags ?? []).join(" | ") },
      { label: "Age verified", get: (r) => (r.ageVerified ? "yes" : "no") },
      { label: "Marketing opt-in", get: (r) => (r.marketingOptIn ? "yes" : "no") },
      { label: "Customer since", get: (r) => iso(r.createdAt) },
      { label: "Orders", get: (r) => r.orderCount },
      { label: "Lifetime spend", get: (r) => money(r.spend) },
    ]);
    filename = `weedmaps-customers-${stamp}.csv`;
  }

  await audit({
    actor: session.name, action: "export", entity: kind,
    summary: `Exported ${count} ${kind} row(s) to CSV.`,
  });

  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
