"use client";

import Link from "next/link";
import Icon from "./Icons";

export default function PromoBanner() {
  return (
    <section className="border-t border-rule py-8">
      <div className="u-shell">
        <div
          style={{
            textAlign: "center",
          }}
        >
          <Link
            href="/products"
            className="u-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "var(--color-orange)",
              color: "var(--color-linen)",
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: "8px",
            }}
          >
            Browse Products
            <Icon name="arrowUpRight" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
