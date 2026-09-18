"use client";

import { useState } from "react";

export default function FridayDealsButton() {
  const [loading, setLoading] = useState(false);

  async function handleSendFridayDeals() {
    if (!confirm("Send Friday Deals email to all subscribers now? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-friday-deals-now", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        alert(`✅ Success! Sent to ${data.sentCount} subscribers.\n\nProducts featured: ${data.productCount}`);
        window.location.href = "/admin/campaigns?friday_sent=1";
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wp-box" style={{ marginBottom: 24, backgroundColor: "#fff8f0", borderLeft: "4px solid #f15a26" }}>
      <div className="wp-box-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: 16 }}>🎉 Friday Deals</h3>
            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Send promotional email with all discounted products to subscribers</p>
          </div>
          <button
            onClick={handleSendFridayDeals}
            disabled={loading}
            className="wp-btn is-primary"
            style={{ marginLeft: 12, whiteSpace: "nowrap" }}
          >
            {loading ? "Sending..." : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
