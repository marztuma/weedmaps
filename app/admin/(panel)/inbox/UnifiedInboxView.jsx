"use client";

import { useEffect, useState } from "react";

const CHANNEL_ICONS = {
  chat: "💬",
  email: "📧",
  sms: "📱",
};

const CHANNEL_COLORS = {
  chat: { bg: "#e8f5e9", text: "#2e7d32" },
  email: { bg: "#e3f2fd", text: "#1565c0" },
  sms: { bg: "#fff3e0", text: "#e65100" },
};

export default function UnifiedInboxView() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadMessages() {
    try {
      const res = await fetch("/api/admin/inbox/messages");
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "all"
      ? messages
      : messages.filter((m) => m.channel === filter);

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPreview = (msg) => {
    const text = msg.body || "(No content)";
    return text.length > 80 ? text.slice(0, 80) + "..." : text;
  };

  if (loading) {
    return <p className="wp-help">Loading messages...</p>;
  }

  if (messages.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p className="wp-help">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="wp-box-body">
      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "chat", "email", "sms"].map((ch) => (
          <button
            key={ch}
            onClick={() => setFilter(ch)}
            className={`wp-pill ${
              filter === ch
                ? "is-blue"
                : "is-grey"
            }`}
            style={{ cursor: "pointer" }}
          >
            {ch === "all"
              ? "All"
              : `${CHANNEL_ICONS[ch]} ${ch.charAt(0).toUpperCase() + ch.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="wp-table-wrap">
        <table className="wp-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>Channel</th>
              <th style={{ width: 150 }}>From</th>
              <th>Message</th>
              <th style={{ width: 120 }}>Time</th>
              <th style={{ width: 80 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((msg, idx) => (
              <tr key={idx}>
                <td>
                  <span
                    className="wp-pill"
                    style={{
                      backgroundColor: CHANNEL_COLORS[msg.channel].bg,
                      color: CHANNEL_COLORS[msg.channel].text,
                    }}
                  >
                    {CHANNEL_ICONS[msg.channel]} {msg.channel}
                  </span>
                </td>
                <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span title={msg.from}>{msg.from}</span>
                </td>
                <td>
                  <span title={msg.body}>{getPreview(msg)}</span>
                </td>
                <td className="wp-help">{formatTime(msg.timestamp || msg.createdAt)}</td>
                <td>
                  <button
                    className="wp-btn"
                    style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                    onClick={() => {
                      if (msg.channel === "chat") {
                        window.location.href = `/admin/chat?id=${msg.conversationId}`;
                      } else if (msg.channel === "email") {
                        alert("Reply to email: " + msg.from);
                      } else if (msg.channel === "sms") {
                        alert("Reply to SMS: " + msg.from);
                      }
                    }}
                  >
                    Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="wp-help" style={{ marginTop: 16, textAlign: "center" }}>
        Showing {filtered.length} of {messages.length} messages · Auto-refreshes every 10 seconds
      </p>
    </div>
  );
}
