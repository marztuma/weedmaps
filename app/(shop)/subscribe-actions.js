"use server";

import { randomBytes } from "node:crypto";
import { eq, sql, gte } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { validEmail, normaliseEmail, headerSafe } from "@/lib/mail/safe";

/* Capturing an address for marketing.

   The consent checkbox is required and unticked, and its state is written to
   the row with a timestamp and a source. That is not politeness — under
   CAN-SPAM and the GDPR the sender carries the burden of showing a person
   agreed, and "we have their address" is not that showing. A row without
   consentedAt can never be sent a campaign, and the query enforces it rather
   than trusting whoever writes the next feature to remember.

   Nothing here gates the site. A storefront that demands an address before it
   will show a price collects addresses people mistype to get past it, and
   those bounce and complain at rates that cost a sending domain its
   reputation. The offer is an offer. */

const MAX_PER_HOUR = 30;

async function overLimit() {
  const [row] = await db
    .select({ n: sql`count(*)`.mapWith(Number) })
    .from(schema.subscribers)
    .where(gte(schema.subscribers.createdAt, new Date(Date.now() - 3600_000)));
  return (row?.n ?? 0) >= MAX_PER_HOUR;
}

export async function subscribe(prevState, formData) {
  const email = normaliseEmail(formData.get("email"));
  const name = headerSafe(formData.get("name"), 96) || null;
  const consent = formData.get("consent") === "on";
  const source = headerSafe(formData.get("source"), 48) || "site";
  const visitorKey = String(formData.get("visitorKey") ?? "");

  if (!validEmail(email)) return { error: "That does not look like an email address." };
  if (!consent) return { error: "Tick the box to confirm you want the emails." };
  if (await overLimit()) return { error: "Too many signups just now. Try again shortly." };

  const token = randomBytes(24).toString("base64url");

  const [row] = await db
    .insert(schema.subscribers)
    .values({
      email,
      name,
      consentedAt: new Date(),
      consentSource: source,
      status: "subscribed",
      unsubscribeToken: token,
    })
    .onConflictDoUpdate({
      target: schema.subscribers.email,
      /* Someone signing up again is re-consenting, which also resurrects a
         previously unsubscribed row — but only because they asked again just
         now, and the timestamp records when. The token is left alone so old
         unsubscribe links keep working. */
      set: {
        name: name ?? undefined,
        consentedAt: new Date(),
        consentSource: source,
        status: "subscribed",
        unsubscribedAt: null,
      },
    })
    .returning({ id: schema.subscribers.id });

  /* Link the browser to the person, now that they have chosen to be one. This
     is the only join between a browsing history and an address, and it exists
     only because they filled the form in. */
  if (/^[a-z0-9]{16,48}$/.test(visitorKey)) {
    await db
      .update(schema.visitors)
      .set({ subscriberId: row.id })
      .where(eq(schema.visitors.visitorKey, visitorKey));
  }

  return { ok: true, message: "You're on the list. Watch for a code in your inbox." };
}

/** One-click unsubscribe, by token, with no login.
 *
 *  Requiring someone to sign in before they can leave is how an unsubscribe
 *  becomes a spam complaint, and a complaint costs far more than the address. */
export async function unsubscribeByToken(token) {
  if (typeof token !== "string" || token.length < 16) return { ok: false };

  const [row] = await db
    .update(schema.subscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(schema.subscribers.unsubscribeToken, token))
    .returning({ email: schema.subscribers.email });

  return { ok: Boolean(row), email: row?.email ?? null };
}
