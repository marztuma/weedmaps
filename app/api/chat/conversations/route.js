import { db, schema } from "@/db/client";
import { desc, eq } from "drizzle-orm";

export async function GET(request) {
  try {
    const conversations = await db
      .select({
        id: schema.chatConversations.id,
        visitorKey: schema.chatConversations.visitorKey,
        status: schema.chatConversations.status,
        contactEmail: schema.chatConversations.contactEmail,
        lastMessageAt: schema.chatConversations.lastMessageAt,
        createdAt: schema.chatConversations.createdAt,
      })
      .from(schema.chatConversations)
      .orderBy(desc(schema.chatConversations.lastMessageAt))
      .limit(50);

    return Response.json({ success: true, conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
