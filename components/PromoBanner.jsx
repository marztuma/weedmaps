"use client";

import Link from "next/link";
import Icon from "./Icons";

export default function PromoBanner() {
  return (
    <section className="border-t border-rule py-16">
      {/* Main Promo Section */}
      <div className="u-shell">
        <div
          style={{
            background: "linear-gradient(135deg, var(--color-ink-soft) 0%, var(--color-ink-soft)/80 100%)",
            borderRadius: "12px",
            padding: "clamp(2rem, 6vw, 4rem)",
            color: "var(--color-linen)",
            textAlign: "center",
          }}
        >
          <h2 className="u-heading" style={{ color: "inherit", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", marginTop: 0 }}>
            ⏰ Services Opening Soon
          </h2>

          <p
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
              marginTop: "1rem",
              marginBottom: "2rem",
              opacity: 0.9,
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            All delivery services are currently closed for the night. Browse our full catalog and get ready to order when they reopen in the morning.
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: "2rem",
            }}
          >
            <Link
              href="/shop"
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
              }}
            >
              Browse Products
              <Icon name="arrowUpRight" size={16} />
            </Link>

            <button
              type="button"
              onClick={() => {
                // Could add notification signup here
                alert("We'll notify you when services reopen!");
              }}
              className="u-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "var(--color-linen)",
                padding: "0.75rem 1.5rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              <Icon name="bell" size={16} />
              Notify Me
            </button>
          </div>
        </div>

        {/* Benefits Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginTop: "3rem",
          }}
        >
          {/* Benefit 1 */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "8px",
              backgroundColor: "var(--color-linen-deep)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🚀</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.5rem" }}>
              Fast Delivery
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-shade)", margin: 0 }}>
              Average delivery time under 30 minutes
            </p>
          </div>

          {/* Benefit 2 */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "8px",
              backgroundColor: "var(--color-linen-deep)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.5rem" }}>
              Licensed & Verified
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-shade)", margin: 0 }}>
              All services are state-licensed
            </p>
          </div>

          {/* Benefit 3 */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "8px",
              backgroundColor: "var(--color-linen-deep)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💰</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.5rem" }}>
              Best Prices
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-shade)", margin: 0 }}>
              Compare prices across all services
            </p>
          </div>

          {/* Benefit 4 */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "8px",
              backgroundColor: "var(--color-linen-deep)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.5rem" }}>
              Wide Selection
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-shade)", margin: 0 }}>
              Thousands of products available
            </p>
          </div>
        </div>

        {/* Featured Products Preview */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: "1rem" }}>
            Popular Items People Order
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {["Flower", "Edibles", "Concentrates", "Tinctures", "Topicals", "Accessories"].map(
              (category) => (
                <Link
                  key={category}
                  href={`/shop?category=${category.toLowerCase()}`}
                  style={{
                    padding: "1rem",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-linen-deep)",
                    textDecoration: "none",
                    color: "var(--color-ink)",
                    fontWeight: 500,
                    transition: "all 0.2s",
                    border: "1px solid var(--color-rule)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "var(--color-rule)";
                    e.target.style.borderColor = "var(--color-ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "var(--color-linen-deep)";
                    e.target.style.borderColor = "var(--color-rule)";
                  }}
                >
                  {category}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "var(--color-orange-tint)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h4 style={{ color: "var(--color-orange-deep)", marginTop: 0, fontSize: "1.1rem" }}>
            👋 First time ordering?
          </h4>
          <p style={{ color: "var(--color-shade)", marginBottom: "1rem" }}>
            Learn about different product types and how to get started
          </p>
          <Link
            href="/learn"
            style={{
              display: "inline-block",
              color: "var(--color-orange-deep)",
              fontWeight: 600,
              textDecoration: "none",
              borderBottom: "2px solid var(--color-orange-deep)",
            }}
          >
            Visit Our Guide →
          </Link>
        </div>
      </div>
    </section>
  );
}
