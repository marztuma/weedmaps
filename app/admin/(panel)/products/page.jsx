import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { bulkDeleteProducts, deleteProduct, duplicateProduct } from "../../actions";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";

const { products, brands, categories, shops, subcategories } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;
const PER_PAGE = 25;

export default async function ProductsAdmin({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.cat === "string" ? sp.cat : "";
  const view = typeof sp.view === "string" ? sp.view : "all";
  const page = Math.max(1, Number(sp.paged) || 1);

  const where = [];
  if (q) where.push(sql`(${products.name} ilike ${"%" + q + "%"} or ${brands.name} ilike ${"%" + q + "%"})`);
  if (cat) where.push(eq(categories.slug, cat));
  if (view === "deals") where.push(sql`${products.wasPriceCents} is not null`);
  if (view === "featured") where.push(eq(products.featured, true));
  const clause = where.length ? and(...where) : undefined;

  const base = db
    .select({
      id: products.id, name: products.name, slug: products.slug,
      price: products.priceCents, was: products.wasPriceCents,
      thc: products.thc, weight: products.weight, featured: products.featured,
      strainType: products.strainType,
      brand: brands.name, category: categories.name, categorySlug: categories.slug,
      sub: subcategories.name, shop: shops.name, live: shops.deliveringNow,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(shops, eq(products.shopId, shops.id))
    .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id));

  const [rows, [{ total }], cats, [{ all, deals, featured }]] = await Promise.all([
    base.where(clause).orderBy(desc(products.featured), asc(products.name))
      .limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(clause),
    db.select({ slug: categories.slug, name: categories.name, n: sql`count(${products.id})`.mapWith(Number) })
      .from(categories).leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id).orderBy(asc(categories.sortOrder)),
    db.select({
      all: sql`count(*)`.mapWith(Number),
      deals: sql`count(*) filter (where ${products.wasPriceCents} is not null)`.mapWith(Number),
      featured: sql`count(*) filter (where ${products.featured})`.mapWith(Number),
    }).from(products),
  ]);

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (extra) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (cat) p.set("cat", cat);
    if (view !== "all") p.set("view", view);
    Object.entries(extra ?? {}).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Products</h1>
        <Link href="/admin/products/new" className="wp-btn">Add New</Link>
        <a href="/admin/export?kind=products" className="wp-btn">Export CSV</a>
        {q && <span className="wp-subtitle">Search results for “{q}”</span>}
      </div>

      <Notice
        map={{
          created: ["is-success", "Product published."],
          deleted: ["is-success", "Product deleted."],
          duplicated: ["is-success", "Product duplicated."],
          bulk: ["is-success", "Selected products deleted."],
        }}
      />

      <ul className="wp-subsubsub">
        <li><Link href={`/admin/products${cat ? `?cat=${cat}` : ""}`} className={view === "all" ? "is-current" : ""}>All <span>({all})</span></Link></li>
        <li><Link href={`/admin/products${qs({ view: "deals", paged: null })}`} className={view === "deals" ? "is-current" : ""}>On sale <span>({deals})</span></Link></li>
        <li><Link href={`/admin/products${qs({ view: "featured", paged: null })}`} className={view === "featured" ? "is-current" : ""}>Featured <span>({featured})</span></Link></li>
      </ul>

      <form method="get" className="wp-tablenav">
        {view !== "all" && <input type="hidden" name="view" value={view} />}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <select name="cat" defaultValue={cat} className="wp-select" style={{ width: "auto", minWidth: 170 }}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.n})</option>)}
          </select>
          <button type="submit" className="wp-btn">Filter</button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input name="q" defaultValue={q} className="wp-input" placeholder="Search products" style={{ width: 220 }} />
          <button type="submit" className="wp-btn">Search Products</button>
        </div>
      </form>

      <form action={bulkDeleteProducts}>
        <div className="wp-tablenav">
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <ConfirmSubmit
              className="wp-btn wp-btn-danger"
              message="Delete every selected product? This cannot be undone."
            >
              Delete selected
            </ConfirmSubmit>
            <span className="wp-subtitle">Tick rows below, then apply.</span>
          </div>
          <span className="wp-subtitle">{total} item{total === 1 ? "" : "s"}</span>
        </div>

        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}><span className="sr-only">Select</span></th>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Delivered by</th>
                <th className="col-num">THC</th>
                <th className="col-num">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: "center" }}>
                  No products found. <Link href="/admin/products">Clear filters</Link> or <Link href="/admin/products/new">add one</Link>.
                </td></tr>
              )}
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><input type="checkbox" name="selected" value={p.id} aria-label={`Select ${p.name}`} /></td>
                  <td>
                    <Link href={`/admin/products/${p.id}`} className="wp-row-title">{p.name}</Link>
                    {p.featured && <span className="wp-pill is-blue" style={{ marginLeft: 6 }}>Featured</span>}
                    {p.was && <span className="wp-pill is-amber" style={{ marginLeft: 6 }}>Sale</span>}
                    <div className="wp-row-actions">
                      <span><Link href={`/admin/products/${p.id}`}>Edit</Link></span>
                      <span><Link href={`/product/${p.slug}`} target="_blank" rel="noreferrer">View</Link></span>
                    </div>
                  </td>
                  <td>{p.brand}</td>
                  <td>{p.category}{p.sub ? <div className="wp-help">{p.sub}</div> : null}</td>
                  <td>
                    {p.shop}
                    <div>
                      <span className={`wp-pill ${p.live ? "is-green" : "is-grey"}`}>
                        <span className="wp-dot" />{p.live ? "Delivering" : "Paused"}
                      </span>
                    </div>
                  </td>
                  <td className="col-num">{Number(p.thc).toFixed(1)}%</td>
                  <td className="col-num">
                    {money(p.price)}
                    {p.was && <div className="wp-help"><s>{money(p.was)}</s></div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>

      {pages > 1 && (
        <div className="wp-tablenav">
          <span className="wp-subtitle">Page {page} of {pages}</span>
          <span style={{ display: "flex", gap: 6 }}>
            {page > 1 && <Link className="wp-btn" href={`/admin/products${qs({ paged: String(page - 1) })}`}>‹ Previous</Link>}
            {page < pages && <Link className="wp-btn" href={`/admin/products${qs({ paged: String(page + 1) })}`}>Next ›</Link>}
          </span>
        </div>
      )}

      {/* Row-level actions live in their own forms so the bulk form stays a single submit. */}
      <div hidden>
        <form action={deleteProduct} id="delete-product-form" />
        <form action={duplicateProduct} id="duplicate-product-form" />
      </div>
    </>
  );
}
