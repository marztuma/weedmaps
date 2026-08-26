import Link from "next/link";
import { asc, sql, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { saveCategory, deleteCategory, addSubcategory, deleteSubcategory } from "../../actions";
import Notice from "@/components/admin/Notice";
import SimpleEditor from "@/components/admin/SimpleEditor";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function CategoriesAdmin({ searchParams }) {
  const sp = await searchParams;
  const editId = Number(sp.edit) || null;

  const [cats, subs] = await Promise.all([
    db.select({
      id: schema.categories.id, name: schema.categories.name, slug: schema.categories.slug,
      blurb: schema.categories.blurb, sortOrder: schema.categories.sortOrder,
      n: sql`count(${schema.products.id})`.mapWith(Number),
    }).from(schema.categories)
      .leftJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
      .groupBy(schema.categories.id).orderBy(asc(schema.categories.sortOrder)),
    db.select({
      id: schema.subcategories.id, name: schema.subcategories.name,
      categoryId: schema.subcategories.categoryId,
    }).from(schema.subcategories).orderBy(asc(schema.subcategories.sortOrder)),
  ]);

  const editing = editId ? cats.find((c) => c.id === editId) : null;

  return (
    <>
      <div className="wp-head"><h1 className="wp-title">Product Categories</h1></div>
      <Notice
        map={{
          deleted: ["is-success", "Category deleted."],
          sub_deleted: ["is-success", "Subcategory deleted."],
        }}
      />

      <div className="wp-grid" style={{ gridTemplateColumns: "minmax(0,320px) minmax(0,1fr)", alignItems: "start" }}>
        <div>
          <SimpleEditor
            action={saveCategory}
            title={editing ? "Edit Category" : "Add New Category"}
            record={editing}
            submitLabel={editing ? "Update Category" : "Add New Category"}
            cancelHref="/admin/categories"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "blurb", label: "Description", type: "textarea", help: "Shown under the category heading on the storefront." },
              { name: "sortOrder", label: "Order", inputMode: "numeric", defaultValue: 99 },
            ]}
          />

          <SimpleEditor
            action={addSubcategory}
            title="Add Subcategory"
            submitLabel="Add Subcategory"
            fields={[
              {
                name: "categoryId", label: "Parent category", type: "select",
                options: cats.map((c) => ({ value: c.id, label: c.name })),
              },
              { name: "name", label: "Subcategory name", required: true, placeholder: "e.g. Live rosin" },
            ]}
          />
        </div>

        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr><th>Category</th><th>Subcategories</th><th className="col-num">Products</th><th /></tr>
            </thead>
            <tbody>
              {cats.map((c) => {
                const mine = subs.filter((s) => s.categoryId === c.id);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/categories?edit=${c.id}`} className="wp-row-title">{c.name}</Link>
                      {c.blurb && <div className="wp-help">{c.blurb}</div>}
                      <div className="wp-row-actions">
                        <span><Link href={`/admin/categories?edit=${c.id}`}>Edit</Link></span>
                        <span><Link href={`/products/${c.slug}`} target="_blank" rel="noreferrer">View</Link></span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 420 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {mine.length === 0 && <span className="wp-help">None yet</span>}
                        {mine.map((s) => (
                          <span key={s.id} className="wp-pill is-grey" style={{ gap: 6 }}>
                            {s.name}
                            <form action={deleteSubcategory} style={{ display: "inline" }}>
                              <input type="hidden" name="id" value={s.id} />
                              <ConfirmSubmit
                                className="wp-btn-plain is-danger"
                                message={`Remove the “${s.name}” subcategory?`}
                                aria-label={`Delete ${s.name}`}
                                style={{ fontSize: 13, lineHeight: 1 }}
                              >
                                ×
                              </ConfirmSubmit>
                            </form>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="col-num">{c.n}</td>
                    <td style={{ width: 90 }}>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit
                          className="wp-btn-plain is-danger"
                          message={`Delete “${c.name}”? Its ${c.n} product(s) and all subcategories go with it.`}
                        >
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
