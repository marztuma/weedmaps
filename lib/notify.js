import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

/* An order notification always lands in the admin panel. Email is best-effort
   on top of that: if SMTP is not configured, or the send fails, the order is
   still recorded and still visible — a dropped email must never lose an order. */

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ADMIN_EMAIL);
}

const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

export function buildOrderEmail(order, lines) {
  const items = lines
    .map((l) => `  ${l.qty} × ${l.nameSnapshot}${l.brandSnapshot ? ` (${l.brandSnapshot})` : ""} — ${money(l.unitPriceCents * l.qty)}`)
    .join("\n");

  const subject = `New order ${order.reference} — ${order.paymentMethodLabel} — ${money(order.totalCents)}`;
  const text = [
    `A new order is awaiting payment confirmation.`,
    ``,
    `Reference     ${order.reference}`,
    `Placed        ${new Date(order.placedAt ?? Date.now()).toLocaleString("en-US")}`,
    `Payment       ${order.paymentMethodLabel}${order.paymentNetwork ? ` (${order.paymentNetwork})` : ""}`,
    `Status        AWAITING PAYMENT — confirm by hand once funds arrive`,
    ``,
    `Customer      ${order.customerName}`,
    `Email         ${order.contactEmail}`,
    `Phone         ${order.contactPhone || "—"}`,
    `Deliver to    ${order.deliveryAddress || "—"}`,
    order.deliveryNotes ? `Notes         ${order.deliveryNotes}` : null,
    ``,
    `Service       ${order.shopName || "—"}`,
    ``,
    `Items`,
    items,
    ``,
    `Subtotal      ${money(order.subtotalCents)}`,
    `Delivery      ${order.deliveryFeeCents ? money(order.deliveryFeeCents) : "Free"}`,
    `Total         ${money(order.totalCents)}`,
    ``,
    order.paymentDestination
      ? `Customer was shown this address:\n  ${order.paymentDestination}`
      : `${order.paymentMethodLabel} details must be sent to the customer by email.`,
    ``,
    `Nothing is confirmed automatically. Verify the funds actually arrived before dispatching.`,
  ].filter((l) => l !== null).join("\n");

  return { subject, text };
}

/** Record the notification, then try to email it. Never throws. */
export async function notifyNewOrder(order, lines) {
  const { subject, text } = buildOrderEmail(order, lines);

  const [row] = await db.insert(schema.adminNotifications).values({
    kind: "order",
    title: subject,
    body: text,
    orderId: order.id,
  }).returning({ id: schema.adminNotifications.id });

  if (!emailConfigured()) {
    await db.update(schema.adminNotifications)
      .set({ emailError: "SMTP not configured — notification kept in the admin panel only." })
      .where(eq(schema.adminNotifications.id, row.id));
    return { emailed: false, reason: "not_configured" };
  }

  try {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "") === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      replyTo: order.contactEmail || undefined,
      subject,
      text,
    });

    await db.update(schema.adminNotifications)
      .set({ emailedAt: new Date(), emailError: null })
      .where(eq(schema.adminNotifications.id, row.id));
    return { emailed: true };
  } catch (err) {
    await db.update(schema.adminNotifications)
      .set({ emailError: String(err?.message ?? err).slice(0, 400) })
      .where(eq(schema.adminNotifications.id, row.id));
    return { emailed: false, reason: "send_failed", error: String(err?.message ?? err) };
  }
}
