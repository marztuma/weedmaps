import Link from "next/link";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { maskEmail } from "@/lib/mail/safe";
import Notice from "@/components/admin/Notice";
import { closeConversation } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

/* Chat threads.
 *
 * The useful view is not "all conversations" — it is the ones the assistant
 * could not answer, because each of those is a question the site is failing to
 * explain. They are the default tab for that reason. */

const VIEWS = [
  { value: "needs_reply", label: "Needs a reply" },
  { value: "open", label: "Answered by chat" },
  { value: "closed", label: "Closed" },
];

const when = (d) =>
  new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default async function Messages({ searchParams }) {
  const sp = await searchParams;
  const view = VIEWS.some((v) => v.value === sp?.view) ? sp.view : "needs_reply";

  const [convos, counts] = await Promise.all([
    db.select({
      id: schema.chatConversations.id,
      status: schema.chatConversations.status,
      email: schema.chatConversations.contactEmail,
      last: schema.chatConversations.lastMessageAt,
      created: schema.chatConversations.createdAt,
    }).from(schema.chatConversations)
      .where(eq(schema.chatConversations.status, view))
      .orderBy(desc(schema.chatConversations.lastMessageAt))
      .limit(40),
    db.select({ status: schema.chatConversations.status, n: sql`count(*)`.mapWith(Number) })
      .from(schema.chatConversations).groupBy(schema.chatConversations.status),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  const messages = convos.length
    ? await db.select().from(schema.chatMessages)
        .where(inArray(schema.chatMessages.conversationId, convos.map((c) => c.id)))
        .orderBy(schema.chatMessages.createdAt)
    : [];

  const byConvo = new Map();
  for (const m of messages) {
    if (!byConvo.has(m.conversationId)) byConvo.set(m.conversationId, []);
    byConvo.get(m.conversationId).push(m);
  }

  return (
    <>
      <h1 className="wp-title">Messages</h1>
      <Notice map={{ closed: ["is-success", "Conversation closed."] }} />

      <p className="wp-subtitle">
        Threads the chat could not answer come here. Each one is a question the site is not
        explaining — the fix is usually a page, not a reply.
      </p>

      <ul className="wp-subsubsub">
        {VIEWS.map((v, i) => (
          <li key={v.value}>
            {i > 0 && " | "}
            <Link href={`/admin/messages?view=${v.value}`}
              className={v.value === view ? "is-current" : ""}
              aria-current={v.value === view ? "page" : undefined}>
              {v.label} ({byStatus[v.value] ?? 0})
            </Link>
          </li>
        ))}
      </ul>

      {convos.length === 0 && (
        <div className="wp-box"><div className="wp-box-body">
          <p style={{ margin: 0 }}>Nothing in this view.</p>
        </div></div>
      )}

      {convos.map((c) => (
        <div className="wp-box" key={c.id} style={{ marginTop: 12 }}>
          <div className="wp-box-head">
            {c.email ? (
              <>Wants a reply at <strong>{maskEmail(c.email)}</strong></>
            ) : (
              <>Anonymous visitor</>
            )}
            <span className="wp-help" style={{ marginLeft: 10, fontWeight: 400 }}>{when(c.last)}</span>
          </div>
          <div className="wp-box-body">
            <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {(byConvo.get(c.id) ?? []).map((m) => (
                <li key={m.id} style={{ marginBottom: 10 }}>
                  <span className={`wp-pill ${m.role === "visitor" ? "is-blue" : "is-grey"}`}>{m.role}</span>
                  <span style={{ marginLeft: 8 }}>{m.body}</span>
                  {m.intent === "unknown" && (
                    <span className="wp-pill is-amber" style={{ marginLeft: 8 }}>not answered</span>
                  )}
                </li>
              ))}
            </ol>

            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
              {c.email && (
                <a className="wp-btn" href={`mailto:${c.email}?subject=Your%20question%20for%20Weedmaps`}>
                  Reply by email
                </a>
              )}
              <form action={closeConversation}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="wp-btn-plain">Mark closed</button>
              </form>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
