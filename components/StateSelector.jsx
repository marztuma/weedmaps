"use client";

import { useState, useRef, useEffect } from "react";
import { STATES, stateName } from "@/lib/states";
import Icon from "./Icons";

/* A dropdown picker for all 50 states.
 *
 * Mounted in the location bar whenever the user types into it. Closed by
 * pressing Escape, clicking a state, or clicking outside. The button shows
 * the current state (CA) or "Change state" if none is selected yet. */

export default function StateSelector({ value, onChange, onDone }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const input = useRef(null);

  useEffect(() => {
    if (open && input.current) {
      input.current.focus();
    }
  }, [open]);

  const filtered = STATES.filter((s) =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    stateName(s.code).toLowerCase().includes(search.toLowerCase())
  );

  const onSelect = (code) => {
    onChange(code);
    setOpen(false);
    setSearch("");
    if (onDone) onDone();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="u-pill flex h-11 shrink-0 items-center gap-2 border border-rule px-4 text-[0.9rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-linen-deep"
      >
        {value ? value.split(",")[0] : "Change state"}
        <Icon name="chevronDown" size={14} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            role="presentation"
          />
          <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-64 max-h-96 overflow-hidden rounded-sm border border-rule bg-paper shadow-xl">
            <input
              ref={input}
              type="text"
              placeholder="Search states…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sticky top-0 h-10 w-full border-b border-rule bg-linen px-3 text-[0.9rem] text-ink outline-none placeholder:text-mute focus:border-orange"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <div className="overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-3 text-center text-[0.85rem] text-mute">
                  No states match "{search}"
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {filtered.map((s) => (
                    <li key={s.code}>
                      <button
                        type="button"
                        onClick={() => onSelect(s.code)}
                        className="w-full px-3 py-2.5 text-left text-[0.9rem] text-ink transition-colors hover:bg-linen-deep"
                      >
                        <span className="font-semibold">{s.code}</span>
                        <span className="ml-2 text-mute">— {stateName(s.code)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
