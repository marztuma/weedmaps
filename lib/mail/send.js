import "server-only";
import { eq, and, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { headerSafe, validEmail, normaliseEmail, redact } from "./safe.js";

/* The one way an email leaves this application.

   `server-only` is load-bearing rather than decorative: it makes the build fail
   if this module is ever pulled into a client component, which is the accident
   that would ship RESEND_API_KEY to a browser.

   Every send is: check configuration, check the address, check suppression,
   check the rate ceiling, claim an idempotency key, call the provider under a
   timeout, record what happened. A failure at any step is recorded and
   returned — it never throws into the caller, because the caller is a checkout
   and an order must not be lost because a mail API had a bad minute. */

const TIMEOUT_MS = 10_000;

/** Per-recipient ceiling, and a global one. Checkout and the review form can
 *  both be driven in a loop by anyone; without this the site is a spam relay
 *  with someone else's quota attached. */
const MAX_PER_RECIPIENT_PER_HOUR = 6;
const MAX_TOTAL_PER_HOUR = 200;

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export function mailStatus() {
  return {
    configured: mailConfigured(),
    hasKey: Boolean(process.env.RESEND_API_KEY),
    from: process.env.MAIL_FROM || null,
    adminEmail: process.env.ADMIN_EMAIL || null,
    webhookReady: Boolean(process.env.RESEND_WEBHOOK_SECRET),
  };
}

async function suppressed(email) {
  const [row] = await db
    .select({ reason: schema.emailSuppressions.reason })
    .from(schema.emailSuppressions)
    .where(eq(schema.emailSuppressions.email, email));
  return row?.reason ?? null;
}

async function overRateLimit(email) {
  const hourAgo = new Date(Date.now() - 3600_000);
  const [row] = await db
    .select({
      mine: sql`count(*) filter (where ${schema.emailLog.recipient} = ${email})`.mapWith(Number),
      all: sql`count(*)`.mapWith(Number),
    })
    .from(schema.emailLog)
    .where(gte(schema.emailLog.createdAt, hourAgo));

  if (!row) return null;
  if (row.mine >= MAX_PER_RECIPIENT_PER_HOUR) return "recipient_hourly_limit";
  if (row.all >= MAX_TOTAL_PER_HOUR) return "global_hourly_limit";
  return null;
}

/** Record an attempt that never reached the provider. Written to the same log
 *  as a real send so "why did this customer get nothing" has one place to look. */
async function logSkip({ template, recipient, subject, key, orderId, status, error }) {
  try {
    await db.insert(schema.emailLog).values({
      template, recipient, subject, idempotencyKey: key, orderId: orderId ?? null,
      status, error: error ? redact(error) : null,
    }).onConflictDoNothing({ target: schema.emailLog.idempotencyKey });
  } catch {
    // The log is diagnostics. It must never be the reason a caller fails.
  }
}

/**
 * Send one email.
 *
 * @param {object}  msg
 * @param {string}  msg.template   short identifier, e.g. "order-confirmation"
 * @param {string}  msg.to         recipient address
 * @param {string}  msg.subject    already-composed subject
 * @param {string}  msg.html
 * @param {string}  msg.text       always supplied; a text part is not optional
 * @param {string}  msg.key        idempotency key, stable for this logical email
 * @param {string} [msg.replyTo]
 * @param {number} [msg.orderId]
 * @returns {Promise<{sent: boolean, reason?: string, id?: string}>}
 */
export async function sendMail({ template, to, subject, html, text, key, replyTo, orderId }) {
  const recipient = normaliseEmail(to);
  const safeSubject = headerSafe(subject, 180);

  if (!validEmail(recipient)) {
    await logSkip({ template, recipient: recipient.slice(0, 254) || "(invalid)", subject: safeSubject, key, orderId, status: "failed", error: "Recipient address failed validation." });
    return { sent: false, reason: "invalid_recipient" };
  }

  if (!mailConfigured()) {
    await logSkip({ template, recipient, subject: safeSubject, key, orderId, status: "skipped", error: "Email is not configured — RESEND_API_KEY and MAIL_FROM must both be set." });
    return { sent: false, reason: "not_configured" };
  }

  const why = await suppressed(recipient);
  if (why) {
    await logSkip({ template, recipient, subject: safeSubject, key, orderId, status: "suppressed", error: `Address suppressed (${why}).` });
    return { sent: false, reason: "suppressed" };
  }

  const limited = await overRateLimit(recipient);
  if (limited) {
    await logSkip({ template, recipient, subject: safeSubject, key, orderId, status: "failed", error: `Rate limit reached (${limited}).` });
    return { sent: false, reason: limited };
  }

  /* Claim the key before calling out.

     idempotency_key is unique, so a second attempt at the same logical email —
     a double-submitted form, a retried action, a replayed invocation — loses
     the insert and returns here rather than sending twice. The provider is
     given the same key as a second line of defence. */
  let logId;
  try {
    const [row] = await db.insert(schema.emailLog).values({
      template, recipient, subject: safeSubject, idempotencyKey: key,
      orderId: orderId ?? null, status: "queued",
    }).returning({ id: schema.emailLog.id });
    logId = row.id;
  } catch {
    return { sent: false, reason: "duplicate" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // A hung provider must not hold a server action open indefinitely.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let result;
    try {
      result = await Promise.race([
        resend.emails.send(
          {
            from: headerSafe(process.env.MAIL_FROM, 200),
            to: [recipient],
            subject: safeSubject,
            html,
            text,
            // Reply-To carries a customer address, so it is header-cleaned and
            // revalidated rather than trusted from the order row.
            ...(replyTo && validEmail(normaliseEmail(replyTo))
              ? { replyTo: normaliseEmail(replyTo) }
              : {}),
            headers: { "X-Entity-Ref-ID": key },
          },
          { idempotencyKey: key }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        ),
      ]);
    } finally {
      clearTimeout(timer);
    }

    if (result?.error) throw new Error(result.error.message ?? String(result.error));

    await db.update(schema.emailLog)
      .set({ status: "sent", providerId: result?.data?.id ?? null, sentAt: new Date(), error: null })
      .where(eq(schema.emailLog.id, logId));

    return { sent: true, id: result?.data?.id };
  } catch (err) {
    await db.update(schema.emailLog)
      .set({ status: "failed", error: redact(err?.message ?? err) })
      .where(eq(schema.emailLog.id, logId));
    return { sent: false, reason: "send_failed" };
  }
}

/** The admin recipient, taken only from configuration. No code path may mail
 *  an administrative alert to an address that arrived in a request. */
export function adminRecipient() {
  const v = normaliseEmail(process.env.ADMIN_EMAIL);
  return validEmail(v) ? v : null;
}
