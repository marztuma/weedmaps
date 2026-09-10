import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import Notice from "@/components/admin/Notice";
import UnifiedInboxView from "./UnifiedInboxView";

export const dynamic = "force-dynamic";

const CHANNEL_COLORS = {
  chat: { bg: "#e8f5e9", text: "#2e7d32", icon: "💬" },
  email: { bg: "#e3f2fd", text: "#1565c0", icon: "📧" },
  sms: { bg: "#fff3e0", text: "#e65100", icon: "📱" },
};

export default async function InboxAdmin() {
  // Fetch stats from all channels
  const [chatConversations, totalMessages] = await Promise.all([
    db
      .select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.status, "needs_reply"))
      .orderBy(desc(schema.chatConversations.lastMessageAt)),
    db
      .select()
      .from(schema.chatMessages)
      .orderBy(desc(schema.chatMessages.createdAt))
      .limit(100),
  ]);

  const stats = {
    chat: {
      waiting: chatConversations.length,
      total: totalMessages.length,
      icon: CHANNEL_COLORS.chat.icon,
    },
    email: {
      waiting: 0, // Would be fetched from Gmail
      icon: CHANNEL_COLORS.email.icon,
    },
    sms: {
      waiting: 0, // Would be fetched from Twilio
      icon: CHANNEL_COLORS.sms.icon,
    },
  };

  return (
    <>
      <h1 className="wp-title">Unified Inbox</h1>

      <Notice
        map={{
          reply_sent: ["is-success", "Reply sent successfully."],
          email_sent: ["is-success", "Email reply sent."],
          sms_sent: ["is-success", "SMS sent successfully."],
        }}
      />

      {/* Channel Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Chat Stats */}
        <div className="wp-box">
          <div className="wp-box-head">
            <span style={{ fontSize: "1.2rem" }}>💬</span> Chat
          </div>
          <div className="wp-box-body">
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                margin: "0 0 8px",
                color: CHANNEL_COLORS.chat.text,
              }}
            >
              {stats.chat.waiting}
            </p>
            <p className="wp-help" style={{ marginTop: 0 }}>
              Waiting for reply
            </p>
            <Link href="/admin/chat" className="wp-btn" style={{ marginTop: 12 }}>
              View Chat →
            </Link>
          </div>
        </div>

        {/* Email Stats */}
        <div className="wp-box">
          <div className="wp-box-head">
            <span style={{ fontSize: "1.2rem" }}>📧</span> Email
          </div>
          <div className="wp-box-body">
            <p style={{ marginTop: 0 }} className="wp-help">
              ⚙️ Setup required
            </p>
            <p className="wp-help">
              Configure Gmail API to receive emails
            </p>
            <Link
              href="/admin/inbox/setup"
              className="wp-btn"
              style={{ marginTop: 12 }}
            >
              Setup Email →
            </Link>
          </div>
        </div>

        {/* SMS Stats */}
        <div className="wp-box">
          <div className="wp-box-head">
            <span style={{ fontSize: "1.2rem" }}>📱</span> SMS
          </div>
          <div className="wp-box-body">
            <p style={{ marginTop: 0 }} className="wp-help">
              ⚙️ Setup required
            </p>
            <p className="wp-help">
              Configure Twilio to send/receive SMS
            </p>
            <Link
              href="/admin/inbox/setup"
              className="wp-btn"
              style={{ marginTop: 12 }}
            >
              Setup SMS →
            </Link>
          </div>
        </div>
      </div>

      {/* Unified Inbox View */}
      <div className="wp-box">
        <div className="wp-box-head">All Channels</div>
        <UnifiedInboxView />
      </div>
    </>
  );
}
