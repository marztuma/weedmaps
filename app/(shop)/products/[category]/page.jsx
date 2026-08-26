import { notFound } from "next/navigation";
import { getCategory, getCategoryProducts, getCategoryIndex } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  const cats = await getCategoryIndex();
  return cats.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const cat = await getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.name} delivered near you — Weedmaps`,
    description: cat.blurb,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params;
  const sp = await searchParams;
  const cat = await getCategory(category);
  if (!cat) notFound();

  const sub = typeof sp.sub === "string" ? sp.sub : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "price_asc";
  const items = await getCategoryProducts(category, { sub, sort });

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Shop", href: "/products" }, { label: cat.name }]}
        title={cat.name}
        blurb={cat.blurb}
        meta={`${items.length} delivering now · ${cat.count} in catalogue`}
      />

      <FilterBar subs={cat.subs} activeSub={sub} activeSort={sort} />

      <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
        <ProductGrid
          products={items}
          emptyTitle="Nothing in that subcategory tonight."
          emptyBody="Every service carrying it has stopped driving. Clear the filter to see the rest of the category."
          emptyAction={
            <Link href={`/products/${category}`} className="u-pill mt-6 inline-flex h-11 items-center bg-ink px-5 text-[0.9rem] text-linen hover:bg-ink-soft">
              Clear filters
            </Link>
          }
        />
      </section>
    </>
  );
}
