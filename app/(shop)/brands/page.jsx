import Link from "next/link";
import { canonical } from "@/lib/seo";
import { getAllBrands } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import Reveal from "@/components/Reveal";

export const revalidate = 60;

export const metadata = {
  alternates: canonical("/brands"),
  title: "Cannabis brands A–Z — Weedmaps",
  description: "Every brand carried by the delivery services that reach you.",
};

export default async function BrandsPage() {
  const brands = await getAllBrands();

  // A–Z index, because 80 brands in one flat list is a scroll, not a directory.
  const groups = new Map();
  for (const b of brands) {
    const letter = /[A-Z]/i.test(b.name[0]) ? b.name[0].toUpperCase() : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(b);
  }
  const letters = [...groups.keys()].sort();

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Brands" }]}
        title="Brands A–Z"
        blurb="Every brand carried by a service that delivers to you. Pick one to see its full catalogue and who brings it."
        meta={`${brands.length} brands`}
      />

      <section className="u-tooth border-y border-rule bg-linen-deep">
        <div className="u-shell flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
          <span className="u-label text-mute">Jump to</span>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {letters.map((l) => (
              <li key={l}>
                <a
                  href={`#letter-${l}`}
                  className="u-data text-[0.9rem] text-ink-soft decoration-orange/60 underline-offset-4 hover:text-ink hover:underline"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
        {letters.map((letter) => (
          <div key={letter} id={`letter-${letter}`} className="mb-10 scroll-mt-[140px]">
            <h2 className="u-display mb-3 text-[2rem] text-fade">{letter}</h2>
            <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {groups.get(letter).map((b, i) => (
                <Reveal as="li" key={b.slug} index={i % 3} className="border-t border-rule">
                  <Link href={`/brand/${b.slug}`} className="group flex items-center justify-between gap-4 py-3.5">
                    {b.logoAvif && (
                      <picture>
                        <source srcSet={b.logoAvif} type="image/avif" />
                        <source srcSet={b.logoWebp} type="image/webp" />
                        <img
                          src={b.logoWebp} alt="" width={36} height={36} loading="lazy"
                          className="h-9 w-9 shrink-0 rounded-xs border border-rule bg-paper object-contain p-1"
                        />
                      </picture>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[1.05rem] font-bold tracking-[-0.02em] text-ink decoration-orange/60 underline-offset-4 group-hover:underline">
                        {b.name}
                      </span>
                      <span className="u-meta mt-0.5 block truncate text-shade">{b.kind}</span>
                    </span>
                    <span className="u-data shrink-0 text-[0.8rem] text-mute">{b.products}</span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
