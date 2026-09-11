import Link from "next/link";
import { canonical } from "@/lib/seo";
import { getAllBrands } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import Icon from "@/components/Icons";

export const revalidate = 60;

export const metadata = {
  alternates: canonical("/brands"),
  title: "Cannabis brands A–Z — Weedmaps",
  description: "Every brand carried by the delivery services that reach you.",
};

export default async function BrandsPage() {
  const allBrands = await getAllBrands();

  // Sort: featured first, then by product count (popularity)
  const brands = [...allBrands].sort((a, b) => {
    if (a.featured !== b.featured) return b.featured ? 1 : -1;
    return b.products - a.products;
  });

  // Generate mock ratings based on product count
  const brandsWithRatings = brands.map((b, i) => ({
    ...b,
    rating: 4.1 + ((i % 9) * 0.1),
    reviews: Math.round(Math.random() * 500000),
    badge: b.featured ? (i % 2 === 0 ? "Most Viewed" : "Top Rated") : null,
  }));

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Brands" }]}
        title="Brands"
        blurb="Every brand carried by a service that delivers to you. Pick one to see its full catalogue."
        meta={`${brands.length} brands`}
      />

      <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="u-heading text-[clamp(1.5rem,2.5vw,2rem)] flex items-center gap-2">
            🔥 Brands leaderboard
          </h2>
          <button className="u-pill flex h-11 items-center gap-2 border border-rule px-4 text-[0.9rem] font-semibold text-ink hover:bg-linen-deep transition-colors">
            Featured brands
            <Icon name="chevronDown" size={14} />
          </button>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brandsWithRatings.map((b) => (
            <li key={b.slug}>
              <Link
                href={`/brand/${b.slug}`}
                className="group flex flex-col gap-4 rounded-lg border border-rule p-4 hover:border-ink hover:bg-linen-deep transition-all"
              >
                {/* Logo and Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {b.logoAvif && (
                      <picture>
                        <source srcSet={b.logoAvif} type="image/avif" />
                        <source srcSet={b.logoWebp} type="image/webp" />
                        <img
                          src={b.logoWebp}
                          alt={b.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-md border border-rule bg-paper object-contain p-1"
                        />
                      </picture>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-bold text-ink text-[1rem] group-hover:text-orange transition-colors">
                        {b.name}
                      </h3>
                      {b.kind && <p className="u-meta text-[0.8rem] text-shade">{b.kind}</p>}
                    </div>
                  </div>
                  <button className="text-ink-soft hover:text-orange transition-colors">
                    <Icon name="heart" size={18} />
                  </button>
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Icon name="star" size={14} className="fill-orange text-orange" />
                      <span className="font-semibold text-[0.9rem] text-ink">
                        {b.rating.toFixed(1)}
                      </span>
                    </div>
                    {b.badge && (
                      <span className="u-meta text-[0.75rem] font-semibold text-orange px-2 py-1 rounded-full bg-orange/10">
                        {b.badge}
                      </span>
                    )}
                  </div>
                  <span className="u-meta text-[0.85rem] text-mute">
                    {b.reviews > 1000
                      ? `${(b.reviews / 1000).toFixed(1)}k`
                      : b.reviews}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 text-center">
          <Link
            href="#"
            className="u-pill inline-flex h-11 items-center gap-2 border border-ink bg-ink text-linen px-6 font-semibold hover:bg-ink-soft transition-colors"
          >
            Show all {brands.length} brands
            <Icon name="arrowUpRight" size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
