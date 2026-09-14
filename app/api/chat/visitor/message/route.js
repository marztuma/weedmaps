import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

export async function POST(request) {
  try {
    const { visitorKey, message } = await request.json();

    if (!visitorKey || !/^[a-z0-9]{16,48}$/.test(visitorKey)) {
      return Response.json(
        { success: false, error: "Invalid visitor key" },
        { status: 400 }
      );
    }

    if (!message || !String(message).trim()) {
      return Response.json(
        { success: false, error: "Message required" },
        { status: 400 }
      );
    }

    let conversation = await db
      .select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.visitorKey, visitorKey))
      .then((r) => r[0]);

    if (!conversation) {
      const [created] = await db
        .insert(schema.chatConversations)
        .values({ visitorKey, status: "open" })
        .returning();
      conversation = created;
    }

    const [msg] = await db
      .insert(schema.chatMessages)
      .values({
        conversationId: conversation.id,
        role: "visitor",
        body: String(message).trim().slice(0, 1000),
      })
      .returning();

    await db
      .update(schema.chatConversations)
      .set({ status: "open", lastMessageAt: new Date() })
      .where(eq(schema.chatConversations.id, conversation.id));

    return Response.json({ success: true, message: msg });
  } catch (error) {
    console.error("Error saving support message:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
