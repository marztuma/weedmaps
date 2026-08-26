import Link from "next/link";
import { asc, sql, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { saveBrand, deleteBrand } from "../../actions";
import Notice from "@/components/admin/Notice";
import SimpleEditor from "@/components/admin/SimpleEditor";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function BrandsAdmin({ searchParams }) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || null;

  const rows = await db
    .select({
      id: schema.brands.id, name: schema.brands.name, slug: schema.brands.slug,
      kind: schema.brands.kind, featured: schema.brands.featured,
      n: sql`count(${schema.products.id})`.mapWith(Number),
    })
    .from(schema.brands)
    .leftJoin(schema.products, eq(schema.products.brandId, schema.brands.id))
    .groupBy(schema.brands.id)
    .orderBy(asc(schema.brands.name));

  const editing = editId ? rows.find((r) => r.id === editId) : null;

  return (
    <>
      <div className="wp-head"><h1 className="wp-title">Brands</h1></div>
      <Notice map={{ deleted: ["is-success", "Brand deleted."] }} />

      <div className="wp-grid" style={{ gridTemplateColumns: "minmax(0,320px) minmax(0,1fr)", alignItems: "start" }}>
        <SimpleEditor
          action={saveBrand}
          title={editing ? "Edit Brand" : "Add New Brand"}
          record={editing}
          submitLabel={editing ? "Update Brand" : "Add New Brand"}
          cancelHref="/admin/brands"
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "kind", label: "Category label", help: "e.g. Flower · Vape" },
            { name: "featured", label: "Featured brand", type: "checkbox" },
          ]}
        />

        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr><th>Name</th><th>Category label</th><th className="col-num">Products</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/admin/brands?edit=${b.id}`} className="wp-row-title">{b.name}</Link>
                    {b.featured && <span className="wp-pill is-blue" style={{ marginLeft: 6 }}>Featured</span>}
                    <div className="wp-row-actions">
                      <span><Link href={`/admin/brands?edit=${b.id}`}>Edit</Link></span>
                      <span><Link href={`/brand/${b.slug}`} target="_blank" rel="noreferrer">View</Link></span>
                    </div>
                  </td>
                  <td>{b.kind ?? "—"}</td>
                  <td className="col-num">{b.n}</td>
                  <td style={{ width: 90 }}>
                    <form action={deleteBrand}>
                      <input type="hidden" name="id" value={b.id} />
                      <ConfirmSubmit
                        className="wp-btn-plain is-danger"
                        message={`Delete “${b.name}”? Its ${b.n} product(s) will be deleted with it.`}
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
