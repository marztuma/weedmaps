import { eq, desc, or } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSession } from "@/lib/auth";
import { fetchGmailMessages } from "@/lib/integrations/email-service";
import { getSMSHistory } from "@/lib/integrations/sms-service";

export async function GET(request) {
  // Admin only
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch from all channels in parallel
    const [chatMessages, gmailMessages, smsMessages] = await Promise.all([
      // Chat messages
      db
        .select({
          id: schema.chatMessages.id,
          channel: "chat",
          from: "visitor",
          body: schema.chatMessages.body,
          createdAt: schema.chatMessages.createdAt,
          conversationId: schema.chatMessages.conversationId,
        })
        .from(schema.chatMessages)
        .orderBy(desc(schema.chatMessages.createdAt))
        .limit(50),

      // Gmail messages
      fetchGmailMessages().then((res) =>
        res.success ? res.messages : []
      ),

      // SMS messages
      getSMSHistory(process.env.TWILIO_PHONE_NUMBER || "+1234567890").then(
        (res) => (res.success ? res.messages : [])
      ),
    ]);

    // Combine and sort
    const allMessages = [
      ...chatMessages.map((m) => ({
        ...m,
        channel: "chat",
        timestamp: m.createdAt,
      })),
      ...gmailMessages.map((m) => ({
        ...m,
        channel: "email",
        timestamp: m.date,
      })),
      ...smsMessages.map((m) => ({
        ...m,
        channel: "sms",
        timestamp: m.date,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return Response.json({
      success: true,
      messages: allMessages,
      channels: {
        chat: chatMessages.length,
        email: gmailMessages.length,
        sms: smsMessages.length,
      },
    });
  } catch (error) {
    console.error("Failed to fetch inbox messages:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
