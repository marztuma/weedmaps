import Link from "next/link";
import Reveal from "./Reveal";
import Icon from "./Icons";

/* An index, not a tile grid: one hairline-ruled row per category carrying its
   own glyph, count and subcategory line, so the taxonomy teaches while it
   navigates (product principle #3). */

export default function CategoryIndex({ categories }) {
  return (
    <section className="u-tooth border-y border-rule bg-linen-deep">
      <div className="u-shell py-[clamp(2.25rem,4vw,3.25rem)]">
        <div className="mb-7 flex items-end justify-between gap-6">
          <h2 className="u-heading text-[clamp(1.5rem,2.6vw,2rem)]">Everything on the shelf</h2>
          <p className="u-meta hidden text-shade sm:block">
            {categories.length} categories ·{" "}
            {categories.reduce((n, c) => n + c.count, 0).toLocaleString("en-US")} items in stock
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
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
  );
}
