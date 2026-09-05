"use client";

import { useDelivery } from "./DeliveryContext";
import StateSelector from "./StateSelector";
import Icon from "./Icons";

const SORTS = [
  { id: "fastest", label: "Fastest", icon: "clock" },
  { id: "rated", label: "Top rated", icon: "star" },
];

export default function LocationBar({ shops }) {
  const { location, setLocation, liveOnly, setLiveOnly, sort, setSort } = useDelivery();

  const inState = shops.filter((s) => s.state === location);
  const live = inState.filter((s) => s.live).length;
  const shown = liveOnly ? live : inState.length;
  const soonest = inState.filter((s) => s.live).reduce((m, s) => Math.min(m, s.etaMin), Infinity);

  return (
    <div className="sticky top-0 z-30 border-b border-rule bg-linen/95 backdrop-blur-sm">
      <div className="u-shell flex flex-col gap-2 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3 sm:py-3">
        {/* The state is the primary filter: nothing below is meaningful until it is set. */}
        <div className="group flex items-center gap-2.5 border-b border-rule pb-1.5 sm:border-0 sm:pb-0">
          <Icon name="truck" size={18} className="shrink-0 text-orange-text" />
          <span className="sr-only">Deliver to</span>
          <StateSelector value={location} onChange={setLocation} />
        </div>

        {/* Two fixed-width pill groups, and on a 390px phone they add up to
            more than the screen — which pushed the whole document five pixels
            sideways. They scroll within their own row instead; the gutter is
            cancelled and re-applied as padding so the first pill still lines
            up with the text above it and the last one is not clipped. */}
        <div className="-mx-[var(--gutter)] flex items-center gap-2 overflow-x-auto px-[var(--gutter)] [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:overflow-x-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            role="switch"
            aria-checked={liveOnly}
            onClick={() => setLiveOnly((v) => !v)}
            className="u-pill flex h-11 shrink-0 items-center gap-2 border px-4 text-[0.85rem] font-semibold"
            style={
              liveOnly
                ? { borderColor: "var(--color-green-text)", backgroundColor: "var(--color-green-tint)", color: "var(--color-green-deep)" }
                : { borderColor: "var(--color-rule)", color: "var(--color-shade)" }
            }
          >
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: liveOnly ? "var(--color-green-text)" : "var(--color-fade)" }}
            />
            Delivering now
          </button>

          <div
            role="radiogroup"
            aria-label="Sort delivery services"
            className="flex shrink-0 rounded-pill border border-ink p-[3px]"
          >
            {SORTS.map((s) => {
              const active = sort === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSort(s.id)}
                  className={`u-pill flex h-11 items-center gap-2 px-4 text-[0.85rem] sm:px-5 ${
                    active ? "bg-ink text-linen" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon name={s.icon} size={15} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="u-meta ml-auto hidden shrink-0 text-shade md:block">
          {shown} services · soonest {Number.isFinite(soonest) ? `${soonest} min` : "—"}
        </p>
      </div>
    </div>
  );
}
