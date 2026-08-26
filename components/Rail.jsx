"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icons";

/* Horizontal shelf with real scroll (touch, trackpad, keyboard) and arrows that
   disable at the ends rather than wrapping silently. */

export default function Rail({ children, label }) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const nudge = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="absolute -top-12 right-[var(--gutter)] hidden gap-2 md:flex">
        {[
          { dir: -1, icon: "chevronLeft", label: "Scroll left", off: edges.start },
          { dir: 1, icon: "chevronRight", label: "Scroll right", off: edges.end },
        ].map((b) => (
          <button
            key={b.dir}
            type="button"
            onClick={() => nudge(b.dir)}
            disabled={b.off}
            aria-label={`${b.label} — ${label}`}
            className="grid h-11 w-11 place-items-center rounded-full border border-rule text-ink transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-linen disabled:cursor-not-allowed disabled:border-rule-soft disabled:text-fade disabled:hover:bg-transparent disabled:hover:text-fade"
          >
            <Icon name={b.icon} size={18} />
          </button>
        ))}
      </div>

      <ul ref={ref} className="u-rail" role="list" aria-label={label}>
        {children}
      </ul>
    </div>
  );
}
