"use client";

import { useDelivery } from "./DeliveryContext";
import Icon from "./Icons";

export default function Masthead({ stats, shops }) {
  const { location, liveOnly } = useDelivery();

  const live = shops.filter((s) => s.live);
  const count = liveOnly ? live.length : shops.length;
  const soonest = live.reduce((m, s) => Math.min(m, s.etaMin), Infinity);
  const city = location.split(",")[0].trim() || "you";

  return (
    <section className="u-shell pt-[clamp(1.25rem,2.2vw,1.5rem)] pb-[clamp(1.25rem,2.2vw,1.75rem)]">
      <h1 className="u-display max-w-[20ch] text-[clamp(2.05rem,6.2vw,4.75rem)]">
        <span className="text-orange">{count}</span> services are delivering to{" "}
        <span className="whitespace-nowrap text-orange">{city}</span> right now.
      </h1>

      <div className="mt-3.5 flex flex-col gap-x-10 gap-y-3 border-t border-rule pt-3 md:flex-row md:items-start md:justify-between">
        <p className="u-prose text-[clamp(0.9rem,0.85rem+0.35vw,1.1rem)] leading-[1.45] text-shade">
          Everything here comes to your door — there is no counter to queue at and nothing to
          collect. Compare the product first; the service that brings it cheapest, and how
          soon it arrives, is on the ticket.
        </p>

        <p className="u-meta flex shrink-0 flex-wrap items-center gap-2.5 text-shade md:pt-1">
          <span className="u-data text-ink">{stats.products.toLocaleString("en-US")}</span>
          products
          <span className="text-rule" aria-hidden="true">/</span>
          <span className="u-data text-ink">{stats.brands}</span>
          brands
          <span className="text-rule" aria-hidden="true">/</span>
          <Icon name="clock" size={14} className="text-green-text" />
          <span className="u-data text-ink">{Number.isFinite(soonest) ? soonest : "—"}</span>
          min soonest
        </p>
      </div>
    </section>
  );
}
