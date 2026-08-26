"use client";

import { useState } from "react";

/* Revenue per day, last 14 days.

   Form: magnitude over time, one series — so a bar chart, and no legend (the
   panel title names the series). Marks are thin with 4px rounded data-ends
   anchored to the baseline and a 2px surface gap between them. Grid is
   recessive: a baseline and one peak reference, nothing else. Labels are
   selective — the peak and today, never a number on every bar. Hover gives the
   exact figure; a table view carries the same data for screen readers.

   Colour is the single wp-admin blue, validated against the white panel
   surface (lightness band, chroma floor, ≥3:1 contrast — all pass). The admin
   has no dark mode, so this commits to the light surface deliberately. */

const money = (c) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export default function RevenueChart({ days }) {
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const max = Math.max(1, ...days.map((d) => d.cents));
  const peakIndex = days.findIndex((d) => d.cents === max);
  const total = days.reduce((n, d) => n + d.cents, 0);
  const H = 120;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <span className="wp-stat-num">{money(total)}</span>
        <span className="wp-stat-label">across {days.length} days</span>
      </div>

      <div
        style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 2, height: H }}
        onMouseLeave={() => setHover(null)}
      >
        {/* peak reference — the only gridline that earns its place */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", left: 0, right: 0, top: 0,
            borderTop: "1px dashed var(--wp-border)", pointerEvents: "none",
          }}
        />
        {days.map((d, i) => {
          const h = Math.max(2, Math.round((d.cents / max) * H));
          const active = hover === i;
          return (
            <div
              key={d.day}
              onMouseEnter={() => setHover(i)}
              style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "100%", cursor: "default" }}
            >
              <div
                style={{
                  width: "100%", height: h,
                  background: active ? "var(--wp-blue-dark)" : "var(--wp-blue)",
                  borderRadius: "4px 4px 0 0",
                  transition: "background .12s ease",
                }}
                title={`${d.label}: ${money(d.cents)}`}
              />
            </div>
          );
        })}

        {hover != null && (
          <div
            role="status"
            style={{
              position: "absolute", top: -6, left: `${(hover / days.length) * 100}%`,
              transform: "translate(-50%,-100%)", whiteSpace: "nowrap",
              background: "var(--wp-base)", color: "#f0f0f1",
              padding: "4px 8px", borderRadius: 3, fontSize: 12, pointerEvents: "none", zIndex: 2,
            }}
          >
            {days[hover].label} · {money(days[hover].cents)}
          </div>
        )}
      </div>

      {/* selective labels only: the peak and the most recent day */}
      <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
        {days.map((d, i) => (
          <div key={d.day} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--wp-text-mute)" }}>
            {i === peakIndex || i === days.length - 1 ? d.short : ""}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="wp-help" style={{ margin: 0 }}>
          Peak {days[peakIndex]?.label}: <strong>{money(max)}</strong>
        </span>
        <button type="button" className="wp-btn-plain" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide table" : "View as table"}
        </button>
      </div>

      {showTable && (
        <table className="wp-table" style={{ marginTop: 10 }}>
          <caption className="sr-only">Revenue per day for the last {days.length} days</caption>
          <thead><tr><th scope="col">Day</th><th scope="col" className="col-num">Revenue</th><th scope="col" className="col-num">Orders</th></tr></thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <td>{d.label}</td>
                <td className="col-num">{money(d.cents)}</td>
                <td className="col-num">{d.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
