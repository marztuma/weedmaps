import "server-only";
import { eq, and, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";

/* Discount codes.
 *
 * Everything here runs on the server against the database, every time. A code
 * is money, and a discount the browser calculated is a discount the browser
 * chose. The storefront may show a preview; the figure that reduces an order
 * is the one this file returns at the moment the order is written.
 *
 * Each check below exists because leaving it out is a hole:
 *
 *   active / window   an expired code is still a valid string in someone's
 *                     inbox, and they will try it
 *   minimum           the whole point of most codes
 *   usage limit       counted from redemptions, not from a counter that a
 *                     failed order could have already incremented
 *   per-customer      without it, one address takes a first-order code
 *                     repeatedly
 *   ceiling           50% off with no cap is fine until somebody assembles a
 *                     large basket
 */

const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

/** Codes are matched case-insensitively and without surrounding space. People
 *  paste them out of emails, complete with a trailing space and shouting. */
export const normaliseCode = (raw) =>
  String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);

/**
 * Work out what a code is worth for a given basket.
 *
 * @returns {Promise<{ok: true, code, discountCents, label} | {ok: false, reason}>}
 */
export async function evaluateCode(rawCode, { subtotalCents, email } = {}) {
  const code = normaliseCode(rawCode);
  if (!code) return { ok: false, reason: "Enter a code." };

  const [row] = await db
    .select()
    .from(schema.discountCodes)
    .where(eq(schema.discountCodes.code, code))
    .limit(1);

  // Same message whether it never existed or is switched off: an error that
  // distinguishes them lets someone enumerate the codes.
  if (!row || !row.active) return { ok: false, reason: "That code is not valid." };

  const now = new Date();
  if (row.startsAt && now < row.startsAt) return { ok: false, reason: "That code is not active yet." };
  if (row.endsAt && now > row.endsAt) return { ok: false, reason: "That code has expired." };

  if (subtotalCents != null && subtotalCents < row.minSubtotalCents) {
    return {
      ok: false,
      reason: `That code needs a subtotal of at least ${money(row.minSubtotalCents)}.`,
    };
  }

  /* Count redemptions rather than trust the counter. A counter can drift — an
     order that failed after incrementing it, a manual edit — and the rows are
     the record. */
  if (row.usageLimit != null) {
    const [used] = await db
      .select({ n: sql`count(*)`.mapWith(Number) })
      .from(schema.discountRedemptions)
      .where(eq(schema.discountRedemptions.codeId, row.id));
    if ((used?.n ?? 0) >= row.usageLimit) {
      return { ok: false, reason: "That code has been fully redeemed." };
    }
  }

  if (email && row.perCustomerLimit > 0) {
    const [mine] = await db
      .select({ n: sql`count(*)`.mapWith(Number) })
      .from(schema.discountRedemptions)
      .where(
        and(
          eq(schema.discountRedemptions.codeId, row.id),
          eq(schema.discountRedemptions.email, String(email).toLowerCase())
        )
      );
    if ((mine?.n ?? 0) >= row.perCustomerLimit) {
      return { ok: false, reason: "You have already used that code." };
    }
  }

  const discountCents = discountFor(row, subtotalCents ?? 0);
  if (discountCents <= 0) return { ok: false, reason: "That code is worth nothing on this basket." };

  return {
    ok: true,
    code: row.code,
    codeId: row.id,
    discountCents,
    label:
      row.kind === "percent"
        ? `${row.value}% off`
        : `${money(row.value)} off`,
  };
}

/** The arithmetic, kept separate so it is testable without a database. */
export function discountFor(row, subtotalCents) {
  let off =
    row.kind === "percent"
      ? Math.floor((subtotalCents * row.value) / 100)
      : row.value;

  if (row.maxDiscountCents != null) off = Math.min(off, row.maxDiscountCents);

  // A discount can never exceed the basket, and never turns into a payout.
  return Math.max(0, Math.min(off, subtotalCents));
}

/** Record a redemption. Called only once an order actually exists. */
export async function recordRedemption({ codeId, orderId, email, amountCents }) {
  await db.insert(schema.discountRedemptions).values({
    codeId,
    orderId: orderId ?? null,
    email: email ? String(email).toLowerCase().slice(0, 254) : null,
    amountCents,
  });
  await db
    .update(schema.discountCodes)
    .set({ usageCount: sql`${schema.discountCodes.usageCount} + 1` })
    .where(eq(schema.discountCodes.id, codeId));
}
