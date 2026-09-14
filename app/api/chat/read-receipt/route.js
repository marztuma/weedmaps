import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const { visitorKey, messageId } = await req.json();

    if (!visitorKey || !messageId) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await db
      .update(schema.chatMessages)
      .set({ status: "read", readAt: new Date() })
      .where(eq(schema.chatMessages.id, messageId))
      .returning();

    if (result.length === 0) {
      return Response.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    return Response.json({ success: true, message: result[0] });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
