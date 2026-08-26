import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand, getAllSlugs } from "@/db/queries";
import { Breadcrumb } from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import JsonLd from "@/components/JsonLd";
import { itemListSchema, breadcrumbSchema, canonical, absolute } from "@/lib/seo";

export const revalidate = 60;

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const b = await getBrand(slug);
  if (!b) return {};
  // A brand we carry but have no stock for is a real page and stays reachable,
  // but it has nothing to rank for. Indexing it invites a thin-content judgement
  // on the whole site, so it is kept out until the shelf is filled.
  const stocked = b.items.length > 0;

  return {
    title: stocked
      ? `${b.name} — ${b.kind ?? "cannabis"} delivered — Weedmaps`
      : `${b.name} — Weedmaps`,
    description: stocked
      ? `Every ${b.name} product delivering to you right now.`
      : `${b.name} on Weedmaps. No ${b.name} products are in stock for delivery right now.`,
    alternates: canonical(`/brand/${slug}`),
    robots: stocked ? undefined : { index: false, follow: true },
    openGraph: { title: b.name, url: absolute(`/brand/${slug}`), type: "website" },
  };
}

export default async function BrandPage({ params }) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  if (!brand) notFound();

  const categories = [...new Set(brand.items.map((i) => i.category))];
  const cheapest = brand.items.reduce((m, i) => Math.min(m, i.price), Infinity);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Brands", href: "/brands" },
    { label: brand.name },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Brand",
            name: brand.name,
            url: absolute(`/brand/${brand.slug}`),
          },
          itemListSchema(brand.items, { name: brand.name, path: `/brand/${brand.slug}` }),
          breadcrumbSchema(trail),
        ]}
      />

      <div className="u-shell pt-[clamp(1.5rem,3vw,2.5rem)]">
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Brands", href: "/brands" },
            { label: brand.name },
          ]}
        />
      </div>

      {brand.bannerAvif && (
        <section className="u-shell pb-[clamp(1rem,2vw,1.75rem)]">
          <div className="relative aspect-[1800/560] w-full overflow-hidden rounded-md border border-rule">
            <picture>
              <source srcSet={brand.bannerAvif} type="image/avif" />
              <source srcSet={brand.bannerWebp} type="image/webp" />
              <img
                src={brand.bannerWebp}
                alt={`${brand.name} banner`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </picture>
          </div>
        </section>
      )}

      <section className="u-shell pb-[clamp(1.5rem,3vw,2.5rem)]">
        <div className="flex flex-col gap-x-12 gap-y-5 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {brand.logoAvif && (
              <picture>
                <source srcSet={brand.logoAvif} type="image/avif" />
                <source srcSet={brand.logoWebp} type="image/webp" />
                <img
                  src={brand.logoWebp}
                  alt={`${brand.name} logo`}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] shrink-0 rounded-sm border border-rule bg-paper object-contain p-1.5"
                />
              </picture>
            )}
          <div className="min-w-0">
            <h1 className="u-display text-[clamp(2rem,5.4vw,4rem)]">{brand.name}</h1>
            <p className="u-meta mt-3 text-shade">{brand.kind}</p>
          </div>
          </div>
          <p className="u-meta shrink-0 text-shade">
            {brand.items.length} products
            {Number.isFinite(cheapest) && (
              <>
                {" · from "}
                <span className="u-data text-ink">${cheapest}</span>
              </>
            )}
          </p>
        </div>

        {categories.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c}>
                <Link
                  href={`/products/${c}`}
                  className="u-pill flex h-11 items-center border border-rule px-3.5 text-[0.8rem] font-semibold text-ink-soft hover:border-ink hover:text-ink"
                >
                  {c.replace("-", " ")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="u-shell pb-[clamp(2.5rem,5vw,4rem)]">
        <ProductGrid
          products={brand.items}
          emptyTitle="Nothing from this brand right now."
          emptyBody="No service delivering to you is carrying it tonight."
        />
      </section>
    </>
  );
}
