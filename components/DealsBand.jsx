import Link from "next/link";
import Reveal from "./Reveal";
import Icon from "./Icons";

/* The one drenched region on the page. Orange ground carries ink text at
   5.4:1, so the loudest surface is also the most readable one. */

export default function DealsBand({ deals, endsIn }) {
  return (
    <section id="deals" className="bg-orange text-ink">
      <div className="u-shell py-[clamp(2.75rem,5.5vw,4.5rem)]">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h2 className="u-display-thin max-w-[13ch] text-[clamp(2.4rem,7vw,5rem)]">
            Cheaper today than yesterday.
          </h2>
          <p className="u-meta flex items-center gap-2 pb-2 text-ember">
            <Icon name="clock" size={14} />
            {endsIn}
          </p>
        </div>

        <ul className="mt-9 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal, i) => {
            const off = Math.round(((deal.was - deal.price) / deal.was) * 100);
            return (
              <Reveal as="li" key={deal.id} index={i % 3} className="border-t border-ink/25">
                <Link href={`/product/${deal.slug}`} className="group flex items-center gap-4 py-4">
                  <span className="u-data grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-[0.9rem] font-semibold text-orange">
                    −{off}%
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="u-meta block truncate text-ember">{deal.brand}</span>
                    <span className="mt-0.5 block truncate text-[1.05rem] font-bold tracking-[-0.02em] underline-offset-4 group-hover:underline">
                      {deal.name}
                    </span>
                    <span className="u-meta mt-1 block truncate text-ember">
                      {deal.shop} · {deal.eta}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="u-data block text-[1.15rem] font-semibold leading-none">
                      ${deal.price}
                    </span>
                    <s className="u-data mt-1 block text-[0.8rem] text-ember">${deal.was}</s>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </ul>

        <Link
          href="/deals"
          className="u-pill mt-9 inline-flex h-12 items-center gap-2 bg-ink px-6 text-[0.95rem] text-linen hover:bg-linen hover:text-ink"
        >
          Every deal delivering tonight
          <Icon name="arrow" size={17} />
        </Link>
      </div>
    </section>
  );
}
