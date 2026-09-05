"use client";

import Link from "next/link";
import { useDelivery } from "./DeliveryContext";
import Reveal from "./Reveal";
import Icon from "./Icons";

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-1" title={`${rating} out of 5`}>
      <Icon name="star" size={13} className="fill-orange text-orange" />
      <span className="u-data text-[0.8rem] font-medium text-ink">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ShopList({ shops }) {
  const { liveOnly, setLiveOnly, location, sort } = useDelivery();

  const list = (shops ?? [])
    .filter((s) => (s?.state ?? "CA") === location)
    .filter((s) => (liveOnly ? s.live : true))
    .sort((a, b) =>
      sort === "rated"
        ? b.rating - a.rating || a.etaMin - b.etaMin
        : a.etaMin - b.etaMin || b.rating - a.rating
    );

  return (
    <section id="shops" className="u-shell py-[clamp(3rem,6vw,5rem)]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="u-heading text-[clamp(1.75rem,3.2vw,2.6rem)]">Delivering to you</h2>
          <p className="mt-2 text-[0.95rem] text-shade">
            {list.length} licensed delivery services reach {location}, ranked by{" "}
            {sort === "rated" ? "rating" : "how soon they arrive"}.
          </p>
        </div>
        <Link href="/deliveries" className="u-pill hidden h-11 items-center gap-1.5 border border-ink px-4 text-[0.85rem] hover:bg-ink hover:text-linen sm:flex">
          All services
          <Icon name="arrowUpRight" size={15} />
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="border-t border-rule py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rule text-fade">
            <Icon name="clock" size={24} />
          </span>
          <p className="u-heading mt-5 text-[1.35rem]">Nobody is driving right now.</p>
          <p className="u-prose mx-auto mt-2 text-[0.95rem] text-shade">
            Every service covering {location} has stopped for the night. Drop the filter to
            see who opens first in the morning.
          </p>
          <button
            type="button"
            onClick={() => setLiveOnly(false)}
            className="u-pill mt-6 inline-flex h-11 items-center gap-2 bg-ink px-5 text-[0.9rem] text-linen hover:bg-ink-soft"
          >
            Show every service
          </button>
        </div>
      ) : (
        <ul className="border-t border-rule">
          {list.map((shop, i) => (
            <Reveal as="li" key={shop.id} index={Math.min(i, 6)} className="border-b border-rule">
              <Link
                href={`/delivery/${shop.slug}`}
                className="group grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-3 py-5 md:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)_minmax(0,1.5fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <h3 className="text-[1.15rem] font-bold tracking-[-0.025em] text-ink decoration-orange/60 underline-offset-4 group-hover:underline">
                      {shop.name}
                    </h3>
                    <span
                      className="u-meta flex items-center gap-1.5 rounded-pill px-2 py-0.5"
                      style={
                        shop.live
                          ? { backgroundColor: "var(--color-green-tint)", color: "var(--color-green-deep)" }
                          : { backgroundColor: "var(--color-rule-soft)", color: "var(--color-shade)" }
                      }
                    >
                      <span
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: shop.live ? "var(--color-green-text)" : "var(--color-fade)" }}
                      />
                      {shop.live ? "Delivering" : "Paused"}
                    </span>
                  </div>
                  <p className="u-meta mt-1.5 text-shade">
                    {shop.area} · {shop.license}
                  </p>
                </div>

                <div className="flex items-center gap-4 md:gap-5">
                  <Stars rating={shop.rating} />
                  <span className="u-meta text-mute">{shop.reviews.toLocaleString("en-US")}</span>
                </div>

                <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:col-span-1">
                  <span className="u-meta flex items-center gap-1.5 text-ink">
                    <Icon name="truck" size={14} className="text-fade" />
                    {shop.live ? shop.eta : shop.window}
                  </span>
                  <span className="u-meta text-shade">
                    {shop.fee === 0 ? "Free delivery" : `$${shop.fee} fee`} · ${shop.minOrder} min
                  </span>
                  <span className="u-meta text-mute">{shop.menuCount} items</span>
                  {shop.deal && (
                    <span className="u-meta rounded-pill px-2 py-0.5" style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}>
                      {shop.deal}
                    </span>
                  )}
                </div>

                <span className="col-start-2 row-start-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rule text-ink transition-colors duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-linen md:col-start-4 md:row-start-auto">
                  <Icon name="arrowUpRight" size={17} />
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
