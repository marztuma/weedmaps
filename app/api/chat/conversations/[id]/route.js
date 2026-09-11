import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const conversation = await db
      .select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.id, parseInt(id)))
      .then((r) => r[0]);

    if (!conversation) {
      return Response.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.conversationId, parseInt(id)));

    return Response.json({ success: true, conversation, messages });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { body } = await request.json();

    if (!body) {
      return Response.json(
        { success: false, error: "Message body required" },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(schema.chatMessages)
      .values({
        conversationId: parseInt(id),
        role: "staff",
        body,
      })
      .returning();

    await db
      .update(schema.chatConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(schema.chatConversations.id, parseInt(id)));

    return Response.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
