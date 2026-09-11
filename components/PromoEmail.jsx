import React from "react";

export default function PromoEmail({ deals, offerCount }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>🎉 This Week's Hot Deals - Weedmaps</title>
      </head>
      <body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f5f5f5", margin: 0, padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #333 100%)", color: "#fff", padding: "40px 20px", textAlign: "center" }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "2.5rem" }}>🎉 Weekly Deals</h1>
            <p style={{ margin: 0, fontSize: "1rem", opacity: 0.9 }}>Fresh offers just for you</p>
          </div>

          {/* Intro Section */}
          <div style={{ padding: "30px 20px", borderBottom: "1px solid #eee" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "1.1rem", color: "#1a1a1a" }}>
              Hey there! 👋
            </p>
            <p style={{ margin: 0, fontSize: "1rem", color: "#666", lineHeight: "1.6" }}>
              We've found <strong>{offerCount} amazing deals</strong> on your favorite products this week. Delivery services are offering incredible discounts on everything from flower to edibles. Check them out before they're gone!
            </p>
          </div>

          {/* Deals Grid */}
          {deals && deals.length > 0 && (
            <div style={{ padding: "30px 20px" }}>
              <h2 style={{ margin: "0 0 20px 0", fontSize: "1.3rem", color: "#1a1a1a", borderBottom: "2px solid #ff6b35", paddingBottom: "10px" }}>
                Top Offers This Week
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {deals.slice(0, 6).map((deal, i) => (
                  <div
                    key={i}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "15px",
                      backgroundColor: "#fafafa",
                      textAlign: "center"
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                      {deal.category === "flower" && "🌿"}
                      {deal.category === "edibles" && "🍬"}
                      {deal.category === "vape" && "💨"}
                      {deal.category === "concentrates" && "⚗️"}
                      {!["flower", "edibles", "vape", "concentrates"].includes(deal.category) && "🎁"}
                    </div>
                    <p style={{ margin: "0 0 8px 0", fontSize: "0.95rem", fontWeight: "bold", color: "#1a1a1a" }}>
                      {deal.name}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#666" }}>
                      {deal.brand}
                    </p>
                    <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: "bold", color: "#ff6b35" }}>
                      ${deal.price}
                      {deal.originalPrice && (
                        <span style={{ textDecoration: "line-through", color: "#999", fontSize: "0.9rem", marginLeft: "8px" }}>
                          ${deal.originalPrice}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div style={{ padding: "30px 20px", backgroundColor: "#f9f9f9", borderTop: "1px solid #eee", textAlign: "center" }}>
            <a
              href="https://weedmap.store/deals"
              style={{
                display: "inline-block",
                backgroundColor: "#ff6b35",
                color: "#fff",
                padding: "15px 40px",
                borderRadius: "25px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: "15px"
              }}
            >
              🛍️ Shop All Deals
            </a>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "#666" }}>
              Limited time offers - Don't miss out!
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#999" }}>
              Offers available while supplies last at participating delivery services
            </p>
          </div>

          {/* Footer */}
          <div style={{ padding: "20px", backgroundColor: "#1a1a1a", color: "#fff", textAlign: "center", fontSize: "0.85rem" }}>
            <p style={{ margin: "0 0 8px 0" }}>
              © 2026 Weedmaps. All rights reserved.
            </p>
            <p style={{ margin: 0, opacity: 0.8 }}>
              You're receiving this because you subscribed to our newsletter.
            </p>
            <p style={{ margin: "8px 0 0 0", opacity: 0.8 }}>
              <a href="https://weedmap.store/unsubscribe" style={{ color: "#ff6b35", textDecoration: "none" }}>
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
