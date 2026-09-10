import { eq, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSession } from "@/lib/auth";

export async function GET(request, { params }) {
  // Admin only
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = Number(params.id);
  if (!conversationId) {
    return Response.json(
      { error: "Invalid conversation ID" },
      { status: 400 }
    );
  }

  try {
    const messages = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.conversationId, conversationId))
      .orderBy(desc(schema.chatMessages.createdAt));

    return Response.json({
      success: true,
      messages: messages.reverse(), // Show oldest first
    });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
