import Link from "next/link";
import Icon from "./Icons";

export default function BrandRibbon({ brands }) {
  const loop = [...brands, ...brands];
  return (
    <section id="brands" className="overflow-hidden border-y border-rule bg-ink py-[clamp(2.5rem,5vw,4rem)] text-linen">
      <div className="u-shell mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h2 className="u-heading text-[clamp(1.75rem,3.2vw,2.6rem)]">
          The brands your driver brings.
        </h2>
        <Link href="/brands" className="u-pill flex h-11 items-center gap-1.5 border border-linen px-4 text-[0.85rem] text-linen hover:bg-linen hover:text-ink">
          All brands A–Z
          <Icon name="arrowUpRight" size={15} />
        </Link>
      </div>

      <div className="u-marquee-host relative">
        <div className="u-marquee flex w-max gap-3" aria-hidden="true">
          {loop.map((brand, i) => (
            <span
              key={`${brand.name}-${i}`}
              className="flex shrink-0 items-baseline gap-3 rounded-pill border border-linen/25 px-5 py-3"
            >
              <span className="text-[1.05rem] font-bold tracking-[-0.025em]">{brand.name}</span>
              <span className="u-label text-fade">{brand.kind}</span>
              <span className="u-data text-[0.8rem] text-fade">{brand.products}</span>
            </span>
          ))}
        </div>
        <ul className="sr-only">
          {brands.map((b) => (
            <li key={b.name}>{`${b.name} — ${b.kind}, ${b.products} products`}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
