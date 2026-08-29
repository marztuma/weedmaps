"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { notifyNewReview } from "@/lib/notify";

/* Submitting a review.

   Everything lands as `pending`. Nothing a stranger typed appears on a public
   page until a human passes it in the admin — that is the entire reason the
   moderation queue exists, and skipping it would mean the first thing a
   spammer writes is the first thing a shopper reads.

   The rating is the only required field. A star with no words is a real and
   very common thing to leave, and refusing it just means fewer ratings. */

const clean = (v, max) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
};

export async function submitReview(prev, formData) {
  const rating = Number.parseInt(formData.get("rating"), 10);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Pick a rating from one to five stars." };
  }

  const productId = Number.parseInt(formData.get("productId"), 10) || null;
  const shopId = Number.parseInt(formData.get("shopId"), 10) || null;
  if (!productId && !shopId) {
    return { ok: false, error: "That review has nothing to attach to." };
  }
  if (productId && shopId) {
    return { ok: false, error: "A review belongs to one thing, not two." };
  }

  // Confirm the target exists rather than trusting a hidden field.
  const target = productId
    ? await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, productId))
    : await db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.id, shopId));
  if (!target.length) return { ok: false, error: "That review has nothing to attach to." };

  const handle = clean(formData.get("author"), 48);
  if (!handle) return { ok: false, error: "Add a name or handle to post under." };

  const body = clean(formData.get("body"), 4000);

  const [created] = await db.insert(schema.reviews).values({
    productId,
    shopId,
    rating,
    title: clean(formData.get("title"), 120),
    body,
    authorHandle: handle,
    authorLocation: clean(formData.get("location"), 96),
    status: "pending",
    seeded: false,
  }).returning({ id: schema.reviews.id });

  await db.insert(schema.adminNotifications).values({
    kind: "review",
    title: `New ${rating}★ review awaiting moderation`,
    body: `${handle} left ${rating} stars${body ? " with a comment" : " with no comment"}. Waiting in Reviews.`,
  });

  /* Best-effort, and after the row exists. A moderation queue nobody is told
     about is a queue nobody empties. */
  await notifyNewReview({
    rating,
    author: handle,
    subject: productId ? "a product" : "a delivery service",
    body,
    reviewId: created.id,
  });

  const path = formData.get("path");
  if (typeof path === "string" && path.startsWith("/")) revalidatePath(path);

  return {
    ok: true,
    message: body
      ? "Thanks — your review is queued for checking and will appear once approved."
      : "Thanks — your rating is queued for checking.",
  };
}
