import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { normaliseEmail, redact } from "@/lib/mail/safe";

/* Delivery feedback from Resend.

   This endpoint is public — it has to be, the provider calls it — so every
   guarantee comes from the signature rather than from who can reach the URL.

   Svix signs the raw body. Any reserialisation changes the bytes and breaks
   the signature, so the body is read as text and passed through untouched;
   nothing here parses JSON before verification. The signature also covers a
   timestamp, which is what makes a captured request unreplayable an hour
   later.

   Without a secret configured the endpoint refuses everything. Failing closed
   matters more than working early: an unauthenticated version of this route
   lets anyone suppress a customer's address and quietly stop their mail. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ok = (body) => Response.json(body, { status: 200 });

export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event;
  try {
    const { Webhook } = await import("svix");
    event = new Webhook(secret).verify(raw, headers);
  } catch {
    // Deliberately unspecific: a caller who cannot sign gets no help tuning
    // their forgery.
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  const type = String(event?.type ?? "").slice(0, 48);
  const data = event?.data ?? {};

  /* Idempotency. Svix retries on any non-2xx, and a redelivered event must not
     be applied twice — a second "bounced" would suppress an address that had
     already been unsuppressed by hand. The provider's own id is the key. */
  const eventId = String(headers["svix-id"] || data.email_id || "").slice(0, 128);
  if (eventId) {
    try {
      await db.insert(schema.emailEvents).values({ eventId, type });
    } catch {
      return ok({ status: "already_processed" });
    }
  }

  const providerId = typeof data.email_id === "string" ? data.email_id.slice(0, 64) : null;
  const recipient = normaliseEmail(Array.isArray(data.to) ? data.to[0] : data.to);

  const patch =
    type === "email.delivered" ? { status: "delivered", deliveredAt: new Date() } :
    type === "email.bounced" ? { status: "bounced", error: redact(data?.bounce?.message ?? "Bounced") } :
    type === "email.complained" ? { status: "complained", error: "Recipient marked this as spam." } :
    type === "email.delivery_delayed" ? { error: "Delivery delayed by the receiving server." } :
    null;

  if (patch && providerId) {
    await db.update(schema.emailLog).set(patch)
      .where(eq(schema.emailLog.providerId, providerId));
  }

  /* A hard bounce means the address does not exist. A complaint means someone
     pressed "this is spam". Continuing to mail either is how a sending domain
     loses its reputation, and mailing after a complaint is a CAN-SPAM problem
     rather than merely a rude one. */
  const suppress =
    type === "email.bounced" && data?.bounce?.type !== "Transient" ? "bounced" :
    type === "email.complained" ? "complained" :
    null;

  if (suppress && recipient) {
    await db.insert(schema.emailSuppressions).values({
      email: recipient,
      reason: suppress,
      detail: redact(data?.bounce?.message ?? type),
    }).onConflictDoNothing({ target: schema.emailSuppressions.email });
  }

  return ok({ status: "ok" });
}

/** Anything but POST is not a webhook. */
export function GET() {
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}
