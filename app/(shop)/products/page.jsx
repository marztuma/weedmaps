import Link from "next/link";
import { canonical } from "@/lib/seo";
import { getCategoryIndex, getAllProducts } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import Reveal from "@/components/Reveal";
import Icon from "@/components/Icons";

export const revalidate = 60;

export const metadata = {
  alternates: canonical("/products"),
  title: "Shop every category — Weedmaps",
  description: "Every cannabis product delivering to you right now, across all nine categories.",
};

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const sort = typeof sp.sort === "string" ? sp.sort : "price_asc";
  const [cats, items] = await Promise.all([getCategoryIndex(), getAllProducts({ sort })]);

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Shop" }]}
        title="Everything on the shelf"
        blurb="Nine categories, every one of them delivered. Pick a shelf, or scroll the whole catalogue below."
        meta={`${items.length} products delivering now`}
      />

      <section className="u-tooth border-y border-rule bg-linen-deep">
        <div className="u-shell py-[clamp(2rem,4vw,3rem)]">
          <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {cats.map((cat, i) => (
              <Reveal as="li" key={cat.slug} index={i % 3} className="border-t border-rule">
                <Link href={`/products/${cat.slug}`} className="group flex items-start gap-4 py-4">
                  <span className="mt-0.5 shrink-0 text-ink-soft transition-colors duration-200 group-hover:text-orange-text">
                    <Icon name={cat.slug} size={26} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[1.05rem] font-bold tracking-[-0.02em] text-ink decoration-orange/60 underline-offset-4 group-hover:underline">
                        {cat.name}
                      </span>
                      <span className="u-data shrink-0 text-[0.8rem] text-mute">{cat.count}</span>
                    </span>
                    <span className="mt-1 block truncate text-[0.9rem] text-shade">
                      {cat.subs.slice(0, 4).join(" · ")}
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="u-heading mb-6 text-[clamp(1.55rem,3.1vw,2.6rem)]">The whole catalogue</h2>
        <ProductGrid products={items} />
      </section>
    </>
  );
}
