"use client";

import { useState } from "react";
import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { replyToChat, updateChatStatus } from "@/app/admin/actions";

export default function ChatThread({ conversation }) {
  const [messages, setMessages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState(null);

  // Load messages on mount
  React.useEffect(() => {
    loadMessages();
  }, [conversation.id]);

  async function loadMessages() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/chat/${conversation.id}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;

    setReplying(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.set("conversationId", conversation.id.toString());
      fd.set("message", reply);

      const result = await replyToChat(null, fd);

      if (result?.error) {
        setError(result.error);
      } else {
        setReply("");
        await loadMessages();
        // Mark as answered if it was needs_reply
        if (conversation.status === "needs_reply") {
          const updateFd = new FormData();
          updateFd.set("conversationId", conversation.id.toString());
          updateFd.set("status", "answered");
          await updateChatStatus(null, updateFd);
        }
      }
    } catch (err) {
      setError("Failed to send reply");
    } finally {
      setReplying(false);
    }
  }

  const formatTime = (d) => {
    const date = new Date(d);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="wp-box">
      <div className="wp-box-head">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            {conversation.contactEmail || "Anonymous Visitor"}
            {conversation.status !== "open" && (
              <span
                className="wp-pill"
                style={{
                  marginLeft: 12,
                  fontSize: "0.8rem",
                  backgroundColor:
                    conversation.status === "needs_reply"
                      ? "#feeaea"
                      : conversation.status === "answered"
                        ? "#eafee5"
                        : "#f0f0f0",
                  color:
                    conversation.status === "needs_reply"
                      ? "#d32f2f"
                      : conversation.status === "answered"
                        ? "#2e7d32"
                        : "#666",
                }}
              >
                {conversation.status}
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#999" }}>
            Started {formatTime(conversation.createdAt)}
          </div>
        </div>
      </div>

      <div
        className="wp-box-body"
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          borderBottom: "1px solid #ddd",
          paddingBottom: 16,
        }}
      >
        {loading && <p className="wp-help">Loading messages…</p>}

        {error && (
          <p className="wp-help is-danger" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        {messages && messages.length === 0 && (
          <p className="wp-help">No messages in this conversation.</p>
        )}

        {messages &&
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 12,
                display: "flex",
                justifyContent: msg.role === "visitor" ? "flex-start" : "flex-end",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  backgroundColor:
                    msg.role === "visitor" ? "#f5f5f5" : "#e8f5e9",
                  borderRadius: 4,
                  padding: "8px 12px",
                  borderLeft:
                    msg.role === "visitor"
                      ? "3px solid #ccc"
                      : "3px solid #4caf50",
                }}
              >
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: 4,
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    color: "#666",
                  }}
                >
                  {msg.role === "visitor" ? "Visitor" : "You"}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.body}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.75rem",
                    color: "#999",
                  }}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Reply Form */}
      <form onSubmit={sendReply} style={{ padding: 16 }}>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: "0.9rem",
            fontWeight: 500,
          }}
        >
          Your Reply
        </label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your response…"
          maxLength={2000}
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 4,
            fontFamily: "inherit",
            fontSize: "0.9rem",
            marginBottom: 12,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
          disabled={replying}
        />

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="submit"
            disabled={replying || !reply.trim()}
            className="wp-btn"
            style={{
              opacity: replying || !reply.trim() ? 0.6 : 1,
              cursor: replying || !reply.trim() ? "not-allowed" : "pointer",
            }}
          >
            {replying ? "Sending…" : "Send Reply"}
          </button>
          <span
            style={{
              fontSize: "0.85rem",
              color: "#999",
            }}
          >
            {reply.length} / 2000
          </span>
        </div>
      </form>

      {error && (
        <div
          style={{
            padding: "8px 16px",
            backgroundColor: "#feeaea",
            color: "#d32f2f",
            fontSize: "0.9rem",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
