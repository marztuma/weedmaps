import "server-only";
import { google } from "googleapis";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";

/* Gmail API Integration
   Fetch emails, send replies, manage support inbox */

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "http://localhost:3000/api/auth/gmail/callback"
);

// Set refresh token if available
if (process.env.GMAIL_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
}

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

/**
 * Fetch emails from Gmail inbox (support channel)
 * Syncs with database for persistence
 */
export async function fetchGmailMessages() {
  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: "label:INBOX is:unread",
      maxResults: 20,
    });

    const messages = res.data.messages || [];
    const formatted = [];

    for (const msg of messages) {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = msgData.data.payload?.headers || [];
      const from = headers.find((h) => h.name === "From")?.value || "Unknown";
      const subject = headers.find((h) => h.name === "Subject")?.value || "(No subject)";
      const date = headers.find((h) => h.name === "Date")?.value || new Date().toISOString();

      let body = "";
      if (msgData.data.payload?.parts) {
        const textPart = msgData.data.payload.parts.find(
          (p) => p.mimeType === "text/plain"
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString();
        }
      } else if (msgData.data.payload?.body?.data) {
        body = Buffer.from(msgData.data.payload.body.data, "base64").toString();
      }

      formatted.push({
        id: msg.id,
        from,
        subject,
        body,
        date: new Date(date),
        source: "email",
      });
    }

    return { success: true, messages: formatted };
  } catch (err) {
    console.error("Failed to fetch Gmail messages:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send email reply via Gmail
 */
export async function sendGmailReply(messageId, to, subject, body) {
  try {
    const email = [
      `From: ${process.env.MAIL_FROM || "noreply@weedmap.store"}`,
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: <${messageId}>`,
      "",
      body,
    ].join("\n");

    const encodedMessage = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Log to database
    await db.insert(schema.inboxMessages).values({
      channel: "email",
      from: process.env.MAIL_FROM || "noreply@weedmap.store",
      to,
      subject: `Re: ${subject}`,
      body,
      status: "sent",
      externalId: res.data.id,
    }).onConflictDoNothing({ target: schema.inboxMessages.externalId });

    return { success: true, messageId: res.data.id };
  } catch (err) {
    console.error("Failed to send email:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark Gmail message as read
 */
export async function markGmailAsRead(messageId) {
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to mark email as read:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get Gmail authorization URL (for initial setup)
 */
export function getGmailAuthUrl() {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
}

/**
 * Handle Gmail OAuth callback
 */
export async function handleGmailCallback(code) {
  try {
    const { credentials } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(credentials);

    // Save refresh token to .env or database
    console.log("Gmail authentication successful!");
    console.log("Refresh token:", credentials.refresh_token);

    return { success: true, refreshToken: credentials.refresh_token };
  } catch (err) {
    console.error("Failed to authenticate with Gmail:", err);
    return { success: false, error: err.message };
  }
}
