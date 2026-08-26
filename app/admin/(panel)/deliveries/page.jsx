import Link from "next/link";
import { asc, sql, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { saveShop, deleteShop } from "../../actions";
import Notice from "@/components/admin/Notice";
import SimpleEditor from "@/components/admin/SimpleEditor";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";

const money = (c) => (c == null ? "—" : `$${(c / 100).toFixed(2)}`);

export default async function DeliveriesAdmin({ searchParams }) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || null;

  const rows = await db
    .select({
      id: schema.shops.id, name: schema.shops.name, slug: schema.shops.slug,
      serviceArea: schema.shops.serviceArea, license: schema.shops.license,
      rating: schema.shops.rating, reviewCount: schema.shops.reviewCount,
      deliveringNow: schema.shops.deliveringNow, windowLabel: schema.shops.windowLabel,
      etaMin: schema.shops.etaMinMinutes, etaMax: schema.shops.etaMaxMinutes,
      minOrderCents: schema.shops.minOrderCents, feeCents: schema.shops.deliveryFeeCents,
      freeOverCents: schema.shops.freeDeliveryOverCents, deal: schema.shops.deal,
      n: sql`count(${schema.products.id})`.mapWith(Number),
    })
    .from(schema.shops)
    .leftJoin(schema.products, eq(schema.products.shopId, schema.shops.id))
    .groupBy(schema.shops.id)
    .orderBy(asc(schema.shops.name));

  const found = editId ? rows.find((r) => r.id === editId) : null;
  const editing = found && {
    ...found,
    rating: Number(found.rating),
    minOrder: (found.minOrderCents / 100).toString(),
    fee: (found.feeCents / 100).toString(),
    freeOver: found.freeOverCents != null ? (found.freeOverCents / 100).toString() : "",
  };

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Delivery Services</h1>
        <span className="wp-subtitle">Every service delivers — this product has no pickup.</span>
      </div>
      <Notice map={{ deleted: ["is-success", "Delivery service deleted."] }} />

      <div className="wp-grid" style={{ gridTemplateColumns: "minmax(0,330px) minmax(0,1fr)", alignItems: "start" }}>
        <SimpleEditor
          action={saveShop}
          title={editing ? "Edit Service" : "Add New Service"}
          record={editing}
          submitLabel={editing ? "Update Service" : "Add New Service"}
          cancelHref="/admin/deliveries"
          fields={[
            { name: "name", label: "Service name", required: true },
            { name: "serviceArea", label: "Service area", placeholder: "Greater LA" },
            { name: "license", label: "Licence", placeholder: "Adult use · C9" },
            { name: "rating", label: "Rating (0–5)", inputMode: "decimal", defaultValue: 4.5 },
            { name: "reviewCount", label: "Review count", inputMode: "numeric", defaultValue: 0 },
            { name: "deliveringNow", label: "Delivering right now", type: "checkbox" },
            { name: "windowLabel", label: "Hours label", placeholder: "Until 10:00 PM" },
            { name: "etaMin", label: "Arrival min (mins)", inputMode: "numeric", defaultValue: 30 },
            { name: "etaMax", label: "Arrival max (mins)", inputMode: "numeric", defaultValue: 60 },
            { name: "minOrder", label: "Order minimum ($)", inputMode: "decimal", defaultValue: 40 },
            { name: "fee", label: "Delivery fee ($)", inputMode: "decimal", defaultValue: 0 },
            { name: "freeOver", label: "Free delivery over ($)", inputMode: "decimal" },
            { name: "deal", label: "Promotion", placeholder: "20% off first order" },
          ]}
        />

        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th>Service</th><th>Status</th><th>Arrives</th>
                <th className="col-num">Fee</th><th className="col-num">Min</th>
                <th className="col-num">Items</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <Link href={`/admin/deliveries?edit=${s.id}`} className="wp-row-title">{s.name}</Link>
                    <div className="wp-help">{s.serviceArea} · {s.license}</div>
                    {s.deal && <div><span className="wp-pill is-amber">{s.deal}</span></div>}
                    <div className="wp-row-actions">
                      <span><Link href={`/admin/deliveries?edit=${s.id}`}>Edit</Link></span>
                      <span><Link href={`/delivery/${s.slug}`} target="_blank" rel="noreferrer">View</Link></span>
                    </div>
                  </td>
                  <td>
                    <span className={`wp-pill ${s.deliveringNow ? "is-green" : "is-grey"}`}>
                      <span className="wp-dot" />{s.deliveringNow ? "Delivering" : "Paused"}
                    </span>
                  </td>
                  <td>{s.deliveringNow ? `${s.etaMin}–${s.etaMax} min` : s.windowLabel}</td>
                  <td className="col-num">{s.feeCents === 0 ? "Free" : money(s.feeCents)}</td>
                  <td className="col-num">{money(s.minOrderCents)}</td>
                  <td className="col-num">{s.n}</td>
                  <td style={{ width: 90 }}>
                    <form action={deleteShop}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmSubmit
                        className="wp-btn-plain is-danger"
                        message={`Delete “${s.name}”? Its ${s.n} product(s) go with it.`}
                      >
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
