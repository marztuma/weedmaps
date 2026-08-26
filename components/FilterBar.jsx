"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Icon from "./Icons";

const SORTS = [
  { id: "price_asc", label: "Price ↑" },
  { id: "price_desc", label: "Price ↓" },
  { id: "potency", label: "Potency" },
  { id: "fastest", label: "Fastest" },
];

/* Filters write to the URL, so a filtered view is a shareable address and the
   back button behaves. Nothing is held in component state that the URL cannot
   reconstruct. */
export default function FilterBar({ subs = [], activeSub, activeSort = "price_asc" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (key, value) => {
    const next = new URLSearchParams(params.toString());
    if (value == null) next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="u-shell flex flex-col gap-4 border-y border-rule py-4">
      {subs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setParam("sub", null)}
            className={`u-pill flex h-11 items-center px-3.5 text-[0.8rem] font-semibold ${
              !activeSub ? "bg-ink text-linen" : "border border-rule text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            All
          </button>
          {subs.filter((s) => s.count > 0).map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setParam("sub", s.name === activeSub ? null : s.name)}
              className={`u-pill flex h-11 items-center gap-1.5 px-3.5 text-[0.8rem] font-semibold ${
                activeSub === s.name ? "bg-ink text-linen" : "border border-rule text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {s.name}
              <span className="u-data text-[0.8rem] text-current opacity-100">{s.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="u-label text-mute">Sort</span>
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setParam("sort", s.id)}
              className={`u-pill flex h-11 items-center px-3.5 text-[0.8rem] font-semibold ${
                activeSort === s.id ? "bg-ink text-linen" : "border border-rule text-ink-soft hover:border-ink hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
