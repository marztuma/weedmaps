"use client";

import { useMemo, useState } from "react";

/* Pick the photograph for a product from the imported library, filtered to the
   product's own category so nobody puts a bong on an edible. Choosing nothing
   is a real option — the storefront falls back to the authored package label,
   which is a designed object rather than a gap. */
export default function ImagePicker({ manifest, category, current }) {
  const [selected, setSelected] = useState(current ?? "");
  const [query, setQuery] = useState("");

  const pool = useMemo(() => {
    const items = manifest[category] ?? [];
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.slug.includes(q)) : items;
  }, [manifest, category, query]);

  const chosen = (manifest[category] ?? []).find((i) => i.avif === selected)
    ?? Object.values(manifest).flat().find((i) => i.avif === selected);

  return (
    <div className="wp-box" style={{ marginBottom: 0 }}>
      <div className="wp-box-head">
        Product image
        <span className="wp-help" style={{ fontWeight: 400 }}>
          {pool.length} available in this category
        </span>
      </div>
      <div className="wp-box-body">
        <input type="hidden" name="imageAvif" value={selected} />
        <input type="hidden" name="imageWebp" value={chosen?.webp ?? ""} />

        {!category && (
          <p className="wp-help" style={{ marginTop: 0 }}>Pick a category first.</p>
        )}

        {category && (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <input
                className="wp-input"
                placeholder="Filter by filename"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ width: 220 }}
              />
              <button
                type="button"
                className="wp-btn"
                onClick={() => setSelected("")}
                disabled={!selected}
              >
                Use the authored label instead
              </button>
              {selected && <span className="wp-pill is-green"><span className="wp-dot" />Photo selected</span>}
            </div>

            <div
              style={{
                display: "grid", gap: 8, maxHeight: 260, overflowY: "auto",
                gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
                border: "1px solid var(--wp-border-soft)", padding: 8, background: "#f6f7f7",
              }}
            >
              {pool.length === 0 && (
                <p className="wp-help" style={{ gridColumn: "1/-1", margin: 0 }}>
                  No images imported for this category.
                </p>
              )}
              {pool.map((img) => {
                const on = selected === img.avif;
                return (
                  <button
                    key={img.slug}
                    type="button"
                    onClick={() => setSelected(on ? "" : img.avif)}
                    title={img.slug}
                    aria-pressed={on}
                    style={{
                      padding: 0, cursor: "pointer", background: "#fff", lineHeight: 0,
                      border: on ? "2px solid var(--wp-blue)" : "1px solid var(--wp-border)",
                      borderRadius: 3, overflow: "hidden",
                      boxShadow: on ? "0 0 0 2px rgba(34,113,177,.25)" : "none",
                    }}
                  >
                    <img
                      src={img.webp}
                      alt={img.slug}
                      width={84}
                      height={84}
                      loading="lazy"
                      style={{ width: "100%", height: 84, objectFit: "cover", display: "block" }}
                    />
                  </button>
                );
              })}
            </div>

            {chosen && (
              <p className="wp-help" style={{ marginTop: 8 }}>
                Selected: <code>{chosen.slug}</code>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
