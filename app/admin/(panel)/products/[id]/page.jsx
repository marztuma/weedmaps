import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { updateProduct, deleteProduct, duplicateProduct } from "../../../actions";
import ProductForm from "@/components/admin/ProductForm";
import manifest from "@/public/products/manifest.json";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isFinite(productId)) notFound();

  const [[product], brands, categories, subcategories, shops] = await Promise.all([
    db.select().from(schema.products).where(eq(schema.products.id, productId)).limit(1),
    db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands).orderBy(asc(schema.brands.name)),
    db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select({ id: schema.subcategories.id, name: schema.subcategories.name, categoryId: schema.subcategories.categoryId })
      .from(schema.subcategories).orderBy(asc(schema.subcategories.sortOrder)),
    db.select({ id: schema.shops.id, name: schema.shops.name, deliveringNow: schema.shops.deliveringNow })
      .from(schema.shops).orderBy(asc(schema.shops.name)),
  ]);

  if (!product) notFound();

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Edit Product</h1>
        <Link href="/admin/products/new" className="wp-btn">Add New</Link>
        <Link href={`/product/${product.slug}`} className="wp-btn" target="_blank" rel="noreferrer">View on site</Link>
        <form action={duplicateProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className="wp-btn">Duplicate</button>
        </form>
      </div>

      <ProductForm
        action={updateProduct}
        product={product}
        brands={brands}
        categories={categories}
        subcategories={subcategories}
        shops={shops}
        manifest={manifest}
        deleteAction
      />

      {/* Kept outside the edit form: a form cannot nest another form. */}
      <form action={deleteProduct} id="delete-this-product" hidden>
        <input type="hidden" name="id" value={product.id} />
      </form>
    </>
  );
}
