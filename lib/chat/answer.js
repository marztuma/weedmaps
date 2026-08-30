import "server-only";
import { sql, eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { searchProducts } from "@/db/queries";

/* Answering a visitor's question.

   The governing rule is the same one that runs through the structured data and
   the review schema: say only what is true of this catalogue. Every answer
   below is assembled from a live query, so it cannot drift from the shelf. If
   a question does not match anything here, the honest reply is that it does
   not, plus an offer to fetch a person — not a plausible sentence.

   That is why this is a matcher over real data rather than a language model.
   A model with no grounding will happily invent a delivery window, a minimum
   order or a THC figure, and on a cannabis marketplace those are not
   harmless mistakes. If a model is added later it belongs here, with the
   catalogue as its context and this file as its fallback.

   Each rule declares what it matches and returns { intent, text, links }. */

const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;
const dollars = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/** Does the question contain any of these? */
const has = (q, ...words) => words.some((w) => q.includes(w));

/** Does it contain something from each group?
 *
 *  This is what makes "how much is delivery", "delivery cost", "what do you
 *  charge to deliver" and "is shipping free" all reach the same answer without
 *  enumerating the phrasings. A list of exact phrases always loses to the
 *  number of ways people ask. */
const both = (q, a, b) => a.some((w) => q.includes(w)) && b.some((w) => q.includes(w));

/** Whole-word match, for tokens too short to use as substrings.
 *
 *  "id" sits inside liquid, provide, rapid and solid, so a substring test
 *  sends "do you have liquid diamonds" to the ID-check answer. Short tokens go
 *  through here instead. */
const word = (q, ...words) =>
  words.some((w) => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, "i").test(q));

const COST = ["how much", "cost", "fee", "price", "charge", "expensive", "free"];
const DELIVERY = ["deliver", "delivery", "shipping", "ship", "driver", "drop off"];
const TIME = ["how long", "how soon", "when", "time", "wait", "fast", "quick", "eta", "arrive"];

export const INTENTS = [
  "greeting", "delivery_area", "delivery_time", "delivery_fee", "minimum",
  "payment", "age_id", "stock", "product_search", "hours", "returns",
  "learn", "contact", "unknown",
];

export async function answer(question) {
  const q = String(question ?? "").toLowerCase().trim();
  if (!q) return { intent: "unknown", text: "Ask me anything about the menu, delivery or payment." };

  /* ── greeting ── */
  if (/^(hi|hey|hello|yo|good (morning|afternoon|evening))\b/.test(q) && q.length < 30) {
    return {
      intent: "greeting",
      text:
        "Hi. I can answer questions about the menu, delivery times and fees, order minimums, " +
        "payment methods and stock. Ask away — and if I cannot answer, I will pass it to a person.",
    };
  }

  /* ── where do you deliver ── */
  if (has(q, "deliver to", "delivery area", "do you deliver", "my area", "near me", "come to", "bring it to") ||
      both(q, DELIVERY, ["where", "area", "zip", "postcode", "city", "address"])) {
    const shops = await db
      .select({ name: schema.shops.name, area: schema.shops.serviceArea })
      .from(schema.shops)
      .where(eq(schema.shops.deliveringNow, true))
      .limit(8);
    return {
      intent: "delivery_area",
      text:
        `${shops.length} services are delivering right now, covering ` +
        `${[...new Set(shops.map((s) => s.area).filter(Boolean))].slice(0, 5).join(", ")}. ` +
        `Set your address at the top of the page and the menu narrows to what can actually reach you.`,
      links: [{ label: "See delivery services", href: "/deliveries" }],
    };
  }

  /* ── fee ── */
  if (both(q, COST, DELIVERY) || has(q, "delivery fee", "postage")) {
    const rows = await db
      .select({ name: schema.shops.name, fee: schema.shops.deliveryFeeCents })
      .from(schema.shops)
      .where(eq(schema.shops.deliveringNow, true));
    const free = rows.filter((r) => !r.fee).length;
    const paid = rows.filter((r) => r.fee).map((r) => r.fee);
    const lo = paid.length ? Math.min(...paid) : 0;
    const hi = paid.length ? Math.max(...paid) : 0;
    return {
      intent: "delivery_fee",
      text:
        free > 0
          ? `${free} of the ${rows.length} services delivering now charge nothing for delivery. ` +
            (paid.length ? `The rest charge between ${money(lo)} and ${money(hi)}. ` : "") +
            `The fee is shown on each service before you commit.`
          : `Delivery fees run from ${money(lo)} to ${money(hi)}, shown on each service before you commit.`,
      links: [{ label: "See fees by service", href: "/deliveries" }],
    };
  }

  /* ── how long ── */
  if (both(q, TIME, DELIVERY) || has(q, "how long", "how soon", "eta", "when will it")) {
    const [row] = await db
      .select({
        fastest: sql`min(${schema.shops.etaMinMinutes})`.mapWith(Number),
        slowest: sql`max(${schema.shops.etaMaxMinutes})`.mapWith(Number),
      })
      .from(schema.shops)
      .where(eq(schema.shops.deliveringNow, true));
    return {
      intent: "delivery_time",
      text:
        `Arrival windows run from about ${row?.fastest ?? 30} to ${row?.slowest ?? 120} minutes, ` +
        `depending on the service and where you are. Each service shows its own window before you order. ` +
        `Drivers run several orders on one route, so a window is a window rather than a promise of a minute.`,
      links: [{ label: "Compare services", href: "/deliveries" }],
    };
  }

  /* ── minimum ── */
  if (has(q, "minimum", "min order", "spend at least", "how much do i have to")) {
    const [row] = await db
      .select({
        lo: sql`min(${schema.shops.minOrderCents})`.mapWith(Number),
        hi: sql`max(${schema.shops.minOrderCents})`.mapWith(Number),
      })
      .from(schema.shops)
      .where(eq(schema.shops.deliveringNow, true));
    return {
      intent: "minimum",
      text:
        `Order minimums are set by each service and currently run from ${money(row?.lo ?? 0)} to ${money(row?.hi ?? 0)}. ` +
        `Your bag is grouped by service at checkout, and each group has to clear its own minimum — one driver cannot carry another company's stock.`,
      links: [{ label: "See minimums", href: "/deliveries" }],
    };
  }

  /* ── payment ── */
  if (has(q, "pay", "payment", "cash app", "cashapp", "zelle", "crypto", "bitcoin", "btc", "card", "visa")) {
    const methods = await db
      .select({ label: schema.paymentMethods.label })
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.active, true));
    return {
      intent: "payment",
      text:
        `Payment is by ${methods.map((m) => m.label).join(", ") || "the methods shown at checkout"}. ` +
        `All of them are send-and-confirm: you pay, then a person here checks the funds arrived before anything is dispatched. ` +
        `Nothing marks itself paid automatically, and none of these can be reversed once sent — so check the destination carefully.`,
      links: [{ label: "Go to checkout", href: "/checkout" }],
    };
  }

  /* ── age and ID ── */
  if (word(q, "id", "21", "18", "age") ||
      has(q, "how old", "medical card", "recommendation", "photo id")) {
    return {
      intent: "age_id",
      text:
        "You must be 21 or over, or 18 or over with a valid medical recommendation. " +
        "The driver checks a government photo ID at the door against the name on the order, and someone of age has to be there to receive it. " +
        "They cannot leave it on a doorstep or with a neighbour.",
    };
  }

  /* ── stock and product questions ── */
  if (has(q, "in stock", "sold out", "available", "do you have", "got any", "carry")) {
    /* Pull the product out of the question.

       The first version stripped everything up to the trigger phrase, which
       works for "do you have blue dream" and fails completely for "is blue
       dream in stock" — there the trigger is at the end, so everything
       including the product name was thrown away and the question fell through
       to the unknown branch. Both are ordinary phrasings.

       Removing the trigger wherever it sits, then the filler words around it,
       leaves the product either way. */
    const term = q
      .replace(/\b(in stock|sold out|available|do you have|do you sell|got any|do you carry|carry)\b/gi, " ")
      .replace(/\b(is|are|do|does|you|have|any|the|a|an|got|still|right now|now|please)\b/gi, " ")
      .replace(/[?.!,]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (term.length >= 2) {
      const found = await searchProducts(term, 4);
      if (found.length) {
        const live = found.filter((p) => p.inStock);
        return {
          intent: "stock",
          text: live.length
            ? `Yes — ${live.slice(0, 3).map((p) => `${p.name} by ${p.brand} at ${dollars(p.price)}`).join("; ")}.` +
              (live.some((p) => p.lowStock) ? " Some are running low." : "")
            : `I found ${found.length} matching ${found.length === 1 ? "product" : "products"}, but ${found.length === 1 ? "it is" : "they are"} out of stock right now.`,
          // Three products can share a name across brands, so a bare name
          // gives three identical links. Brand and price make them choosable.
          links: found.slice(0, 3).map((p) => ({
            label: `${p.name} — ${p.brand} — ${dollars(p.price)}${p.inStock ? "" : " (out of stock)"}`,
            href: `/product/${p.slug}`,
          })),
        };
      }
      return {
        intent: "stock",
        text: `Nothing on the menu matches "${term}" right now.`,
        links: [{ label: "Browse everything", href: "/products" }],
      };
    }
  }

  /* ── opening hours ── */
  if (has(q, "open", "hours", "what time", "closed", "still delivering")) {
    const [row] = await db
      .select({ live: sql`count(*) filter (where ${schema.shops.deliveringNow})`.mapWith(Number), all: sql`count(*)`.mapWith(Number) })
      .from(schema.shops);
    return {
      intent: "hours",
      text:
        `${row?.live ?? 0} of ${row?.all ?? 0} services are delivering at the moment. ` +
        `Each one keeps its own hours, and a paused service is hidden from the shelf rather than shown as unavailable.`,
      links: [{ label: "See who is live", href: "/deliveries" }],
    };
  }

  /* ── returns ── */
  if (has(q, "refund", "return", "wrong item", "missing", "damaged", "complaint")) {
    return {
      intent: "returns",
      text:
        "Check the package before the driver leaves — a mismatch is far easier to sort at the door than afterwards. " +
        "Once cannabis leaves a licensed premises it usually cannot go back into inventory, so services handle problems with credits and replacements rather than restocking. " +
        "If something is wrong with an order, leave your email below and a person will pick it up.",
    };
  }

  /* ── editorial ── */
  if (has(q, "thc", "cbd", "terpene", "coa", "certificate", "lab", "dose", "dosage", "edible", "strong", "indica", "sativa")) {
    return {
      intent: "learn",
      text:
        "There are written guides on exactly this — how to read a certificate of analysis, why THC percentage is a poor way to pick flower, and how to dose edibles without a bad evening.",
      links: [
        { label: "How to read a certificate of analysis", href: "/learn/how-to-read-a-certificate-of-analysis" },
        { label: "Edibles: start at 2.5mg and wait", href: "/learn/edibles-start-at-2-5mg-and-wait" },
        { label: "THC percentage is a bad way to pick flower", href: "/learn/thc-percentage-is-a-bad-way-to-pick-flower" },
      ],
    };
  }

  /* ── contact ── */
  if (has(q, "speak to", "human", "someone", "contact", "phone", "call", "email you")) {
    return {
      intent: "contact",
      text: "Leave your email below with the question and a person will answer it directly.",
    };
  }

  /* ── a product name, most likely ── */
  {
    const term = q.replace(/[?.!]/g, "").trim();
    if (term.length >= 3) {
      const found = await searchProducts(term, 4);
      if (found.length) {
        return {
          intent: "product_search",
          text: `${found.length} ${found.length === 1 ? "match" : "matches"} on the menu:`,
          links: found.slice(0, 4).map((p) => ({
            label: `${p.name} — ${p.brand} — ${dollars(p.price)}${p.inStock ? "" : " (out of stock)"}`,
            href: `/product/${p.slug}`,
          })),
        };
      }
    }
  }

  /* ── nothing matched ──

     Deliberately admits it rather than guessing. A confident wrong answer
     about a delivery window or a dose is worse than no answer. */
  return {
    intent: "unknown",
    text:
      "I could not answer that from the menu. I can help with delivery areas and times, fees, " +
      "order minimums, payment methods, ID requirements and what is in stock. " +
      "For anything else, leave your email below and a person will reply.",
  };
}
