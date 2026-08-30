"use server";

import { eq, sql, gte, and, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { answer } from "@/lib/chat/answer";
import { validEmail, normaliseEmail, headerSafe } from "@/lib/mail/safe";

/* The chat endpoint.

   Public and unauthenticated, so it is treated as hostile input throughout:
   every message is length-capped, the visitor key is validated as a token
   rather than trusted, and both the per-visitor and global message rates are
   capped. Without those the widget is an open write endpoint that anyone can
   use to fill the database. */

const MAX_MESSAGE = 1000;
const MAX_PER_VISITOR_PER_HOUR = 40;
const MAX_TOTAL_PER_HOUR = 600;

/** A visitor key is a random token minted in the browser. It is only ever used
 *  to group messages into a thread — it is not a login and grants nothing, so
 *  the check is on shape, not authenticity. */
const validKey = (k) => typeof k === "string" && /^[a-z0-9]{16,48}$/.test(k);

async function overLimit(visitorKey) {
  const hourAgo = new Date(Date.now() - 3600_000);
  const [row] = await db
    .select({
      mine: sql`count(*) filter (where ${schema.chatConversations.visitorKey} = ${visitorKey})`.mapWith(Number),
      all: sql`count(*)`.mapWith(Number),
    })
    .from(schema.chatMessages)
    .innerJoin(schema.chatConversations, eq(schema.chatMessages.conversationId, schema.chatConversations.id))
    .where(gte(schema.chatMessages.createdAt, hourAgo));

  if (!row) return null;
  if (row.mine >= MAX_PER_VISITOR_PER_HOUR) return "You have sent a lot of messages in a short time. Try again shortly.";
  if (row.all >= MAX_TOTAL_PER_HOUR) return "Chat is busy right now. Try again in a few minutes.";
  return null;
}

async function conversationFor(visitorKey) {
  const [existing] = await db
    .select({ id: schema.chatConversations.id })
    .from(schema.chatConversations)
    .where(eq(schema.chatConversations.visitorKey, visitorKey))
    .orderBy(desc(schema.chatConversations.lastMessageAt))
    .limit(1);
  if (existing) return existing.id;

  const [made] = await db
    .insert(schema.chatConversations)
    .values({ visitorKey })
    .returning({ id: schema.chatConversations.id });
  return made.id;
}

/** Ask a question. Returns the reply for the widget to render. */
export async function ask(prevState, formData) {
  const visitorKey = String(formData.get("visitorKey") ?? "");
  const raw = String(formData.get("message") ?? "").trim();

  if (!validKey(visitorKey)) return { error: "Something went wrong. Reload the page and try again." };
  if (!raw) return { error: "Type a question first." };
  if (raw.length > MAX_MESSAGE) return { error: "That is longer than the chat accepts. Try a shorter question." };

  const limited = await overLimit(visitorKey);
  if (limited) return { error: limited };

  const conversationId = await conversationFor(visitorKey);

  await db.insert(schema.chatMessages).values({
    conversationId, role: "visitor", body: raw.slice(0, MAX_MESSAGE),
  });

  const reply = await answer(raw);

  await db.insert(schema.chatMessages).values({
    conversationId, role: "bot", body: reply.text, intent: reply.intent,
  });

  /* A question the matcher could not place is the useful signal — those are
     the things the site is failing to explain. Flag the thread so it surfaces
     in the admin rather than being inferred from logs later. */
  await db.update(schema.chatConversations)
    .set({
      lastMessageAt: new Date(),
      ...(reply.intent === "unknown" ? { status: "needs_reply" } : {}),
    })
    .where(eq(schema.chatConversations.id, conversationId));

  return { reply: { text: reply.text, links: reply.links ?? [], intent: reply.intent } };
}

/** Hand the thread to a person. */
export async function requestHuman(prevState, formData) {
  const visitorKey = String(formData.get("visitorKey") ?? "");
  const email = normaliseEmail(formData.get("email"));
  const note = headerSafe(formData.get("note"), 500);

  if (!validKey(visitorKey)) return { error: "Something went wrong. Reload the page and try again." };
  if (!validEmail(email)) return { error: "That does not look like an email address." };

  const limited = await overLimit(visitorKey);
  if (limited) return { error: limited };

  const conversationId = await conversationFor(visitorKey);

  await db.update(schema.chatConversations)
    .set({ contactEmail: email, status: "needs_reply", lastMessageAt: new Date() })
    .where(eq(schema.chatConversations.id, conversationId));

  if (note) {
    await db.insert(schema.chatMessages).values({
      conversationId, role: "visitor", body: note, intent: "contact",
    });
  }

  await db.insert(schema.adminNotifications).values({
    kind: "chat",
    title: "A visitor asked to be contacted",
    body: `${email} left a question in chat.${note ? `\n\n${note}` : ""}`,
  });

  return { ok: true, message: "Thanks — a person will reply to that address." };
}
