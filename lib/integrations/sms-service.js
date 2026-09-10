import "server-only";
import { Twilio } from "twilio";
import { db, schema } from "@/db/client";

/* Twilio SMS Integration
   Send and receive SMS messages for customer support */

const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || "+1234567890";

/**
 * Send SMS reply to customer
 */
export async function sendSMS(toPhone, message) {
  try {
    const result = await twilio.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: toPhone,
    });

    // Log to database
    await db.insert(schema.inboxMessages).values({
      channel: "sms",
      from: TWILIO_PHONE,
      to: toPhone,
      body: message,
      status: "sent",
      externalId: result.sid,
    }).onConflictDoNothing({ target: schema.inboxMessages.externalId });

    return { success: true, messageId: result.sid };
  } catch (err) {
    console.error("Failed to send SMS:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get incoming SMS messages from Twilio
 * (These would come via webhook in production)
 */
export async function getSMSHistory(phoneNumber) {
  try {
    const messages = await twilio.messages.list({
      from: phoneNumber,
      limit: 20,
    });

    const formatted = messages.map((msg) => ({
      id: msg.sid,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      date: msg.dateCreated,
      status: msg.status,
      source: "sms",
    }));

    return { success: true, messages: formatted };
  } catch (err) {
    console.error("Failed to fetch SMS history:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Handle incoming SMS webhook from Twilio
 * Called when customer texts your number
 */
export async function handleIncomingSMS(messageData) {
  try {
    const { From, To, Body, MessageSid, DateSent } = messageData;

    // Store in database
    await db.insert(schema.inboxMessages).values({
      channel: "sms",
      from: From,
      to: To,
      body: Body,
      status: "received",
      externalId: MessageSid,
      createdAt: new Date(DateSent),
    }).onConflictDoNothing({ target: schema.inboxMessages.externalId });

    // Create support ticket if needed
    await db.insert(schema.chatConversations).values({
      visitorKey: From.replace(/\D/g, ""), // Use phone number as key
      status: "needs_reply",
      contactEmail: From, // Store phone number in email field for now
      lastMessageAt: new Date(),
    }).onConflictDoNothing();

    return { success: true };
  } catch (err) {
    console.error("Failed to handle incoming SMS:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get SMS stats
 */
export async function getSMSStats() {
  try {
    const messages = await twilio.messages.list({ limit: 100 });

    const sent = messages.filter((m) => m.direction === "outbound-api").length;
    const received = messages.filter((m) => m.direction === "inbound").length;

    return {
      success: true,
      stats: {
        sent,
        received,
        total: messages.length,
      },
    };
  } catch (err) {
    console.error("Failed to get SMS stats:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Verify Twilio credentials
 */
export async function verifyTwilioCredentials() {
  try {
    const account = await twilio.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    return { success: true, accountName: account.friendlyName };
  } catch (err) {
    console.error("Failed to verify Twilio credentials:", err);
    return { success: false, error: "Invalid Twilio credentials" };
  }
}
