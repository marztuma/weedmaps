import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { createProduct } from "../../../actions";
import ProductForm from "@/components/admin/ProductForm";
import manifest from "@/public/products/manifest.json";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const [brands, categories, subcategories, shops] = await Promise.all([
    db.select({ id: schema.brands.id, name: schema.brands.name }).from(schema.brands).orderBy(asc(schema.brands.name)),
    db.select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
    db.select({ id: schema.subcategories.id, name: schema.subcategories.name, categoryId: schema.subcategories.categoryId })
      .from(schema.subcategories).orderBy(asc(schema.subcategories.sortOrder)),
    db.select({ id: schema.shops.id, name: schema.shops.name, deliveringNow: schema.shops.deliveringNow })
      .from(schema.shops).orderBy(asc(schema.shops.name)),
  ]);

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Add New Product</h1>
        <Link href="/admin/products" className="wp-btn">Back to Products</Link>
      </div>
      <ProductForm
        action={createProduct}
        brands={brands}
        categories={categories}
        subcategories={subcategories}
        shops={shops}
        manifest={manifest}
      />
    </>
  );
}
