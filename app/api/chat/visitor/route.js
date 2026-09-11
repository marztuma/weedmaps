import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const visitorKey = searchParams.get("visitorKey");

  if (!visitorKey || !/^[a-z0-9]{16,48}$/.test(visitorKey)) {
    return Response.json({ success: false, error: "Invalid visitor key" }, { status: 400 });
  }

  try {
    const conversation = await db
      .select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.visitorKey, visitorKey))
      .then((r) => r[0]);

    if (!conversation) {
      return Response.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.conversationId, conversation.id));

    return Response.json({ success: true, conversation, messages });
  } catch (error) {
    console.error("Error fetching visitor conversation:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
