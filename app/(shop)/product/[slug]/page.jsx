import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelated, getAllSlugs } from "@/db/queries";
import { Breadcrumb } from "@/components/PageHeader";
import { PriceTicket } from "@/components/ProductCard";
import ProductLabel from "@/components/ProductLabel";
import ProductGrid from "@/components/ProductGrid";
import AddToCart from "@/components/AddToCart";
import Icon from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { productSchema, breadcrumbSchema, canonical, absolute } from "@/lib/seo";
import { resolveProductImage } from "@/lib/images";

export const revalidate = 60;

// Rendered on demand and cached, not pre-built: pre-rendering every product at
// build time meant 152 concurrent database reads and a flaky build.
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.brand} ${p.name} — ${p.weight} delivered — Weedmaps`,
    description: p.description
      ? p.description.slice(0, 155)
      : `${p.name} by ${p.brand}. ${p.thc}% THC, ${p.weight}. Delivered by ${p.shop} in ${p.eta}.`,
    alternates: canonical(`/product/${slug}`),
    openGraph: {
      title: `${p.brand} — ${p.name}`,
      description: p.description?.slice(0, 200),
      url: absolute(`/product/${slug}`),
      type: "website",
      images: [{
        url: absolute(`/og/product/${slug}`),
        width: 1200, height: 630,
        alt: `${p.brand} ${p.name}`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.brand} — ${p.name}`,
      description: p.description?.slice(0, 200),
      images: [absolute(`/og/product/${slug}`)],
    },
  };
}

function Spec({ label, value }) {
  return (
    <div className="border-t border-rule py-3">
      <dt className="u-label text-mute">{label}</dt>
      <dd className="u-data mt-1 text-[1rem] text-ink">{value}</dd>
    </div>
  );
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const related = await getRelated(p.category, p.slug, 10);

  const trail = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/products" },
    { label: p.categoryName, href: `/products/${p.category}` },
    { label: p.name },
  ];
  const resolved = resolveProductImage(p, "hero");
  const imageUrl = resolved?.src?.startsWith("http")
    ? resolved.src
    : resolved?.src ? absolute(resolved.src) : null;

  const liveChip = p.shopLive
    ? { backgroundColor: "var(--color-green-tint)", color: "var(--color-green-deep)" }
    : { backgroundColor: "var(--color-rule-soft)", color: "var(--color-shade)" };

  return (
    <>
      <JsonLd data={[productSchema(p, { imageUrl }), breadcrumbSchema(trail)]} />

      <div className="u-shell pt-[clamp(1.5rem,3vw,2.5rem)]">
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            { label: p.categoryName, href: `/products/${p.category}` },
            { label: p.name },
          ]}
        />
      </div>

      <section className="u-shell pb-[clamp(2.5rem,5vw,4rem)]">
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[420px] lg:mx-0">
            <ProductLabel product={p} category={p.category} size="hero" />
            <p className="u-meta mt-3 text-mute">
              {p.image
                ? "Product photography. Demonstration imagery — see the note in the footer."
                : "Authored package label — no photography exists for this product."}
            </p>
          </div>

          <div className="min-w-0">
            <Link
              href={`/brand/${p.brandSlug}`}
              className="u-meta text-shade decoration-orange/60 underline-offset-4 hover:text-ink hover:underline"
            >
              {p.brand}
            </Link>
            <h1 className="u-display mt-2 max-w-[16ch] text-[clamp(2rem,5vw,3.5rem)]">{p.name}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PriceTicket price={p.price} was={p.was} size="lg" />
              <span className="u-meta rounded-pill border border-rule px-3 py-1 text-shade">{p.weight}</span>
              <span className="u-meta rounded-pill border border-rule px-3 py-1 text-shade">{p.type}</span>
            </div>

            {p.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li
                    key={t}
                    className="u-meta rounded-pill px-2.5 py-1"
                    style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 rounded-md border border-ink p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="u-label text-mute">Delivered by</p>
                  <Link
                    href={`/delivery/${p.shopSlug}`}
                    className="mt-1 block text-[1.15rem] font-bold tracking-[-0.025em] text-ink decoration-orange/60 underline-offset-4 hover:underline"
                  >
                    {p.shop}
                  </Link>
                  <p className="u-meta mt-1.5 text-shade">
                    {p.shopArea} · {p.shopLicense}
                  </p>
                </div>
                <span className="u-meta flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1" style={liveChip}>
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: p.shopLive ? "var(--color-green-text)" : "var(--color-fade)" }}
                  />
                  {p.shopLive ? "Delivering" : "Paused"}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                <Spec label="Arrives" value={p.shopLive ? p.eta : p.shopWindow} />
                <Spec label="Delivery" value={p.shopFee === 0 ? "Free" : `$${p.shopFee}`} />
                <Spec label="Minimum" value={`$${p.shopMin}`} />
                <Spec label="Rating" value={`${p.shopRating.toFixed(1)} / 5`} />
              </dl>

              <AddToCart product={p} disabled={!p.shopLive} />
              <p className="u-meta mt-3 text-center text-mute">
                Checkout happens on the service&rsquo;s own menu. 21+ and ID at the door.
              </p>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-8 sm:grid-cols-4">
              <Spec label="THC" value={`${p.thc}%`} />
              <Spec label="CBD" value={`${p.cbd}%`} />
              <Spec label="Strain" value={p.type} />
              <Spec label="Type" value={p.subcategory ?? p.categoryName} />
            </dl>

            {p.description && (
              <div className="mt-8 border-t border-rule pt-6">
                <h2 className="u-label text-mute">About this product</h2>
                <p className="u-prose mt-2.5 text-[1rem] leading-relaxed text-ink">
                  {p.description}
                </p>
              </div>
            )}

            {(p.effects?.length > 0 || p.flavors?.length > 0) && (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {p.effects?.length > 0 && (
                  <div>
                    <h3 className="u-label text-mute">Reported effects</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {p.effects.map((e) => (
                        <li key={e} className="u-meta rounded-pill border border-rule px-2.5 py-1 text-shade">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.flavors?.length > 0 && (
                  <div>
                    <h3 className="u-label text-mute">Tastes like</h3>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {p.flavors.map((e) => (
                        <li key={e} className="u-meta rounded-pill border border-rule px-2.5 py-1 text-shade">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="u-prose mt-6 text-[0.9rem] leading-relaxed text-shade">
              Lab-tested with a certificate of analysis on file. Potency figures are batch
              values and vary between runs. Keep out of reach of children; do not drive under
              the influence.
            </p>
          </div>
        </div>
      </section>

      <section className="u-tooth border-t border-rule bg-linen-deep">
        <div className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
          <div className="mb-6 flex items-end justify-between gap-6">
            <h2 className="u-heading text-[clamp(1.55rem,3.1vw,2.6rem)]">
              More {p.categoryName.toLowerCase()}
            </h2>
            <Link
              href={`/products/${p.category}`}
              className="u-pill hidden h-11 items-center gap-1.5 border border-ink px-4 text-[0.85rem] hover:bg-ink hover:text-linen sm:flex"
            >
              All {p.categoryName.toLowerCase()}
              <Icon name="arrowUpRight" size={15} />
            </Link>
          </div>
          <ProductGrid products={related} />
        </div>
      </section>
    </>
  );
}
