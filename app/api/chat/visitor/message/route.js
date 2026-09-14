import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { sendMail } from "@/lib/mail/send.js";

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

    const isNewConversation = !conversation;

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

    // Send email notification to admin on new conversation
    if (isNewConversation) {
      try {
        const [settings] = await db.select().from(schema.emailSettings).limit(1);
        const adminEmail = settings?.adminEmail || process.env.ADMIN_EMAIL;

        if (adminEmail) {
          const visitorDisplay = conversation.contactEmail || `Visitor ${conversation.visitorKey.slice(0, 8)}`;
          await sendMail({
            template: "support-chat-new",
            to: adminEmail,
            subject: `New support chat from ${visitorDisplay}`,
            text: `A new support chat has been started.\n\nVisitor: ${visitorDisplay}\nConversation ID: ${conversation.id}\n\nFirst message: "${msg.body}"\n\nClick the link to respond: ${process.env.NEXTAUTH_URL || "http://localhost:3100"}/admin/chat`,
            html: `<p>A new support chat has been started.</p><p><strong>Visitor:</strong> ${visitorDisplay}</p><p><strong>First message:</strong></p><blockquote>${msg.body}</blockquote><p><a href="${process.env.NEXTAUTH_URL || "http://localhost:3100"}/admin/chat">View conversation</a></p>`,
            key: `support-chat-new-${conversation.id}`,
          });
        }
      } catch (error) {
        console.error("Error sending admin notification:", error);
        // Don't fail the message if email fails
      }
    }

    return Response.json({ success: true, message: msg });
  } catch (error) {
    console.error("Error saving support message:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
