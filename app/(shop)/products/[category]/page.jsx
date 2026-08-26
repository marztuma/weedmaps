import { notFound } from "next/navigation";
import { getCategory, getCategoryProducts, getCategoryIndex, pageNumber } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import ProductGrid from "@/components/ProductGrid";
import Pager from "@/components/Pager";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { itemListSchema, breadcrumbSchema, canonicalPage } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const cats = await getCategoryIndex();
  return cats.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params, searchParams }) {
  const { category } = await params;
  const [cat, sp] = await Promise.all([getCategory(category), searchParams]);
  if (!cat) return {};
  const page = pageNumber(sp.page);
  return {
    title: page > 1
      ? `${cat.name} delivered near you — page ${page} — Weedmaps`
      : `${cat.name} delivered near you — Weedmaps`,
    description: cat.blurb,
    // ?sub= and ?sort= reorder the same goods; they are not separate pages.
    // ?page= is: each page holds different products.
    alternates: canonicalPage(`/products/${category}`, page),
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params;
  const sp = await searchParams;
  const cat = await getCategory(category);
  if (!cat) notFound();

  const sub = typeof sp.sub === "string" ? sp.sub : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "price_asc";
  const page = pageNumber(sp.page);
  const listing = await getCategoryProducts(category, { sub, sort, page });

  // A page past the end is not an empty shelf, it is a wrong address.
  if (page > listing.pages) notFound();

  const trail = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: cat.name },
  ];

  return (
    <>
      <JsonLd
        data={[
          itemListSchema(listing.items, { name: cat.name, path: `/products/${category}` }),
          breadcrumbSchema(trail),
        ]}
      />

      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Shop", href: "/products" }, { label: cat.name }]}
        title={cat.name}
        blurb={cat.blurb}
        meta={`${listing.total} delivering now · ${cat.count} in catalogue`}
      />

      <FilterBar subs={cat.subs} activeSub={sub} activeSort={sort} />

      <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
        <ProductGrid
          products={listing.items}
          emptyTitle="Nothing in that subcategory tonight."
          emptyBody="Every service carrying it has stopped driving. Clear the filter to see the rest of the category."
          emptyAction={
            <Link href={`/products/${category}`} className="u-pill mt-6 inline-flex h-11 items-center bg-ink px-5 text-[0.9rem] text-linen hover:bg-ink-soft">
              Clear filters
            </Link>
          }
        />
        <Pager
          page={listing.page}
          pages={listing.pages}
          total={listing.total}
          perPage={listing.perPage}
          basePath={`/products/${category}`}
          params={{ sub, sort: sort === "price_asc" ? null : sort }}
        />
      </section>
    </>
  );
}
