import Rail from "./Rail";
import Link from "next/link";
import Reveal from "./Reveal";
import ProductCard from "./ProductCard";
import Icon from "./Icons";

export default function Shelf({ shelf, tone = "linen", flush = false }) {
  const pad = flush
    ? "pt-0 pb-[clamp(2.5rem,5vw,4rem)]"
    : "py-[clamp(2.5rem,5vw,4rem)]";
  return (
    <section
      id={shelf.category === "flower" ? "shelves" : undefined}
      className={`${tone === "deep" ? "u-tooth bg-linen-deep " : ""}${pad}`}
    >
      <div className="u-shell mb-4 flex items-end justify-between gap-6 sm:mb-6">
        <div>
          <h3 className="u-heading text-[clamp(1.55rem,3.1vw,2.6rem)]">{shelf.title}</h3>
          <p className="mt-1.5 text-[0.9rem] text-shade">{shelf.note}</p>
        </div>
        <a
          href={`/products/${shelf.category}`}
          className="u-pill hidden h-11 shrink-0 items-center gap-1.5 border border-ink px-4 text-[0.85rem] hover:bg-ink hover:text-linen sm:flex"
        >
          All {shelf.title.toLowerCase()}
          <Icon name="arrowUpRight" size={15} />
        </a>
      </div>

      <div className="pl-[var(--gutter)] [--shell-pad:calc((100vw-min(100vw,var(--shell)))/2)] xl:pl-[calc(var(--shell-pad)+var(--gutter))]">
        <Rail label={`${shelf.title} near you`}>
          {shelf.items.map((item, i) => (
            <Reveal as="li" key={item.id} index={i} className="w-[clamp(158px,42vw,212px)]">
              <ProductCard product={item} category={shelf.category} />
            </Reveal>
          ))}
          <li className="w-[clamp(158px,42vw,212px)] pr-[var(--gutter)]">
            <Link
              href={`/products/${shelf.category}`}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-rule text-center transition-colors duration-200 hover:border-ink hover:bg-linen"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-ink">
                <Icon name="arrow" size={18} />
              </span>
              <span className="u-meta max-w-[14ch] text-shade">
                Browse all {shelf.title.toLowerCase()}
              </span>
            </Link>
          </li>
        </Rail>
      </div>
    </section>
  );
}
