import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { sendMail, adminRecipient, mailConfigured, mailStatus } from "@/lib/mail/send";
import {
  orderConfirmation, paymentConfirmed, adminNewOrder, adminNewReview,
} from "@/lib/mail/templates";
import { redact } from "@/lib/mail/safe";

/* What gets emailed, and when.

   The invariant this file has always held: an order notification lands in the
   admin panel first, and email is layered on top. A send that fails, or a
   provider that is not configured, must never cost an order. Everything here
   returns a result; nothing throws into a checkout.

   What changed is who gets told. Until now only the administrator was emailed
   — a customer placed an order, saw a wallet address on a page, and left with
   no record of what they owed. */

export { mailStatus };

/** Kept for the admin's configuration panel, which asks this by name. */
export function emailConfigured() {
  return mailConfigured();
}

/* ── A new order ─────────────────────────────────────────── */

export async function notifyNewOrder(order, lines) {
  const admin = adminNewOrder(order, lines);

  // The panel record comes first and unconditionally.
  const [row] = await db.insert(schema.adminNotifications).values({
    kind: "order",
    title: admin.subject,
    body: admin.text,
    orderId: order.id,
  }).returning({ id: schema.adminNotifications.id });

  const results = { admin: null, customer: null };

  const to = adminRecipient();
  if (to) {
    results.admin = await sendMail({
      template: "admin-new-order",
      to,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      // Replying to the alert should reach the customer, so this is the one
      // place a request-supplied address is used — validated inside sendMail.
      replyTo: order.contactEmail || undefined,
      key: `admin-new-order:${order.id}`,
      orderId: order.id,
    });
  }

  /* The customer's own copy: their reference, their items, and the address to
     pay. This is the email that did not exist. */
  if (order.contactEmail) {
    const c = orderConfirmation(order, lines);
    results.customer = await sendMail({
      template: "order-confirmation",
      to: order.contactEmail,
      subject: c.subject,
      html: c.html,
      text: c.text,
      key: `order-confirmation:${order.id}`,
      orderId: order.id,
    });
  }

  const note = !mailConfigured()
    ? "Email is not configured — this notification is in the admin panel only."
    : [
        results.admin && !results.admin.sent ? `admin copy: ${results.admin.reason}` : null,
        results.customer && !results.customer.sent ? `customer copy: ${results.customer.reason}` : null,
      ].filter(Boolean).join("; ") || null;

  if (note) {
    await db.update(schema.adminNotifications)
      .set({ emailError: redact(note) })
      .where(eq(schema.adminNotifications.id, row.id));
  } else {
    await db.update(schema.adminNotifications)
      .set({ emailedAt: new Date(), emailError: null })
      .where(eq(schema.adminNotifications.id, row.id));
  }

  return {
    emailed: Boolean(results.admin?.sent || results.customer?.sent),
    admin: results.admin,
    customer: results.customer,
  };
}

/* ── Payment confirmed by hand ───────────────────────────── */

/** Called after a human marks an order paid. Nothing calls this automatically,
 *  because nothing confirms these payment rails automatically. */
export async function notifyPaymentConfirmed(order) {
  if (!order?.contactEmail) return { sent: false, reason: "no_recipient" };

  const m = paymentConfirmed(order);
  return sendMail({
    template: "payment-confirmed",
    to: order.contactEmail,
    subject: m.subject,
    html: m.html,
    text: m.text,
    key: `payment-confirmed:${order.id}`,
    orderId: order.id,
  });
}

/* ── A review is waiting ─────────────────────────────────── */

export async function notifyNewReview({ rating, author, subject, body, reviewId }) {
  const to = adminRecipient();
  if (!to) return { sent: false, reason: "no_recipient" };

  const m = adminNewReview({ rating, author, subject, body });
  return sendMail({
    template: "admin-new-review",
    to,
    subject: m.subject,
    html: m.html,
    text: m.text,
    key: `admin-new-review:${reviewId}`,
  });
}
