import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import Notice from "@/components/admin/Notice";
import ChatThread from "./ChatThread";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  open: "is-blue",
  needs_reply: "is-red",
  answered: "is-green",
  closed: "is-grey",
};

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

export default async function ChatAdmin({ searchParams }) {
  const sp = await searchParams;
  const conversationId = sp?.id ? Number(sp.id) : null;

  // Fetch all conversations with message counts
  const [conversations, [stats]] = await Promise.all([
    db
      .select({
        id: schema.chatConversations.id,
        status: schema.chatConversations.status,
        contactEmail: schema.chatConversations.contactEmail,
        lastMessageAt: schema.chatConversations.lastMessageAt,
        createdAt: schema.chatConversations.createdAt,
        messageCount: sql`count(${schema.chatMessages.id})`.mapWith(Number),
      })
      .from(schema.chatConversations)
      .leftJoin(
        schema.chatMessages,
        eq(schema.chatMessages.conversationId, schema.chatConversations.id)
      )
      .groupBy(schema.chatConversations.id)
      .orderBy(desc(schema.chatConversations.lastMessageAt))
      .limit(100),
    db
      .select({
        total: sql`count(*)`.mapWith(Number),
        needsReply: sql`count(*) filter (where status = 'needs_reply')`.mapWith(
          Number
        ),
        answered: sql`count(*) filter (where status = 'answered')`.mapWith(
          Number
        ),
        closed: sql`count(*) filter (where status = 'closed')`.mapWith(Number),
      })
      .from(schema.chatConversations),
  ]);

  const selectedConversation =
    conversationId && conversations.find((c) => c.id === conversationId);

  return (
    <>
      <h1 className="wp-title">Support Chat</h1>

      <Notice
        map={{
          reply_sent: [
            "is-success",
            "Your reply has been sent to the visitor.",
          ],
          status_updated: ["is-success", "Conversation status updated."],
          invalid_convo: ["is-error", "Conversation not found."],
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left: Conversation List */}
        <div className="wp-box">
          <div className="wp-box-head">Conversations</div>
          <div className="wp-box-body">
            <div style={{ marginBottom: 16 }}>
              <p className="wp-help" style={{ marginTop: 0 }}>
                <strong>{stats.needsReply}</strong> waiting •{" "}
                <strong>{stats.answered}</strong> answered •{" "}
                <strong>{stats.closed}</strong> closed
              </p>
            </div>
          </div>

          <div className="wp-table-wrap">
            <table className="wp-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Status</th>
                  <th>Visitor</th>
                  <th style={{ width: 100 }}>Last Message</th>
                </tr>
              </thead>
              <tbody>
                {conversations.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: 24 }}>
                      No conversations yet.
                    </td>
                  </tr>
                )}
                {conversations.map((convo) => (
                  <tr
                    key={convo.id}
                    onClick={() => {}}
                    style={{
                      backgroundColor:
                        selectedConversation?.id === convo.id
                          ? "#f5f5f5"
                          : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <td>
                      <span className={`wp-pill ${STATUS_TONE[convo.status]}`}>
                        {convo.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/chat?id=${convo.id}`}
                        style={{
                          color: "#0066cc",
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>
                          {convo.contactEmail || "Anonymous"}
                        </div>
                        <div
                          className="wp-help"
                          style={{ fontSize: "0.8rem", marginBottom: 2 }}
                        >
                          {convo.messageCount} messages
                        </div>
                      </Link>
                    </td>
                    <td className="wp-help">
                      {formatTime(convo.lastMessageAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Conversation Detail */}
        {selectedConversation ? (
          <ChatThread conversation={selectedConversation} />
        ) : (
          <div className="wp-box">
            <div className="wp-box-head">Select a Conversation</div>
            <div
              className="wp-box-body"
              style={{ textAlign: "center", padding: "3rem 2rem" }}
            >
              <p className="wp-help">
                Click a conversation on the left to view and reply to messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
