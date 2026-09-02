"use server";

import { validState } from "@/lib/states";
import { evaluateCode, recordRedemption } from "@/lib/discounts";

import { priceFromCents } from "@/lib/money";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, inArray, and, sql, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { notifyNewOrder } from "@/lib/notify";

const { products, shops, brands, customers, orders, orderItems, paymentMethods } = schema;

const str = (fd, k) => String(fd.get(k) ?? "").trim();
const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

function reference() {
  // WM-XXXXXX, unambiguous alphabet (no O/0/I/1) so it survives being read aloud.
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[randomInt(A.length)];
  return `WM-${s}`;
}

/**
 * Place an order. Prices, fees and totals are recomputed from the database —
 * the browser's cart is treated as a list of intentions, never as a source of
 * money. The order is created `awaiting_payment` and no code path here can
 * mark it paid.
 */
export async function placeOrder(_prev, formData) {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const phone = str(formData, "phone");
  const address = str(formData, "address");
  /* Validated against the list rather than trusted. A <select> constrains a
     browser, not a request. */
  const discountCode = str(formData, "discountCode");
  const rawState = str(formData, "state").toUpperCase();
  const state = validState(rawState) ? rawState : null;
  const notes = str(formData, "notes");
  const methodCode = str(formData, "method");
  const ageOk = formData.get("age") === "on";

  let cart;
  try {
    cart = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    cart = [];
  }

  const errors = [];
  if (!name) errors.push("Enter the name the driver should ask for.");
  if (!isEmail(email)) errors.push("Enter a valid email address — this is how we send payment details and updates.");
  if (!address) errors.push("Enter the delivery address.");
  if (!state) errors.push("Choose the state we are delivering to.");
  if (!methodCode) errors.push("Choose how you want to pay.");
  if (!ageOk) errors.push("You must confirm you are 21 or over, and that someone 21+ will receive the delivery.");
  if (!Array.isArray(cart) || cart.length === 0) errors.push("Your bag is empty.");
  if (errors.length) return { errors };

  const [method] = await db.select().from(paymentMethods)
    .where(eq(paymentMethods.code, methodCode)).limit(1);
  if (!method || !method.active) return { errors: ["That payment method is not available right now."] };

  // Re-read every line from the database. Never trust a client-side price.
  const slugs = [...new Set(cart.map((l) => String(l.slug)))];
  const rows = await db.select({
    id: products.id, slug: products.slug, name: products.name,
    priceCents: products.priceCents, shopId: products.shopId,
    brand: brands.name, shopName: shops.name,
    fee: shops.deliveryFeeCents, min: shops.minOrderCents,
    freeOver: shops.freeDeliveryOverCents, live: shops.deliveringNow,
  })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(inArray(products.slug, slugs));

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length) {
    return { errors: [`${missing.length} item(s) in your bag are no longer available. Remove them and try again.`] };
  }

  const paused = rows.filter((r) => !r.live).map((r) => r.shopName);
  if (paused.length) {
    return { errors: [`${[...new Set(paused)].join(", ")} stopped delivering. Remove those items or try again later.`] };
  }

  /* Split into one order per service.

     The customer is told to order whatever they like and that we arrange the
     delivery, which is true — but arranging it still means a separate
     fulfilment per company, because an Erba Markets driver cannot carry
     Grassdoor stock. The split is operational and belongs here, not in the
     customer's head: they place one basket, the admin sees the orders that
     have to be filled. */
  const groups = new Map();
  for (const line of cart) {
    const p = bySlug.get(String(line.slug));
    const qty = Math.max(1, Math.min(99, Number(line.qty) || 1));
    if (!groups.has(p.shopId)) {
      groups.set(p.shopId, { shopId: p.shopId, shopName: p.shopName, fee: p.fee, min: p.min, freeOver: p.freeOver, lines: [] });
    }
    groups.get(p.shopId).lines.push({ p, qty });
  }

  const under = [];
  for (const g of groups.values()) {
    g.subtotal = g.lines.reduce((n, l) => n + l.p.priceCents * l.qty, 0);
    g.deliveryFee = g.freeOver != null && g.subtotal >= g.freeOver ? 0 : g.fee;
    g.total = g.subtotal + g.deliveryFee;
    if (g.subtotal < g.min) {
      under.push(`${g.shopName} needs ${priceFromCents(g.min)} minimum — you have ${priceFromCents(g.subtotal)}.`);
    }
  }
  if (under.length) return { errors: under };

  // customer record, reused by email so the CRM builds a history
  const [existing] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  let customerId;
  if (existing) {
    customerId = existing.id;
    await db.update(customers).set({
      name, phone: phone || existing.phone, address: address || existing.address,
      state: state || existing.state,
      ageVerified: true,
      stage: existing.stage === "lead" ? "first_order" : existing.stage,
    }).where(eq(customers.id, existing.id));
  } else {
    const [created] = await db.insert(customers).values({
      name, email, phone: phone || null, address, state, stage: "first_order", ageVerified: true,
    }).returning({ id: customers.id });
    customerId = created.id;
  }

  /* One evaluation for the whole basket, against the true subtotal.

     Evaluating per service would let one code apply several times over —
     three services, three discounts, from a code meant to be used once. The
     discount is worked out once and then spread across the orders in
     proportion to what each is worth, so no single order can be discounted
     below zero and the parts still sum to the whole. */
  const basketSubtotal = [...groups.values()].reduce((n, g) => n + g.subtotal, 0);
  const discount = discountCode
    ? await evaluateCode(discountCode, { subtotalCents: basketSubtotal, email })
    : null;

  if (discountCode && discount && !discount.ok) {
    return { errors: [discount.reason] };
  }

  const totalDiscount = discount?.ok ? discount.discountCents : 0;
  let discountRemaining = totalDiscount;

  const created = [];
  const groupList = [...groups.values()];
  for (let gi = 0; gi < groupList.length; gi++) {
    const g = groupList[gi];

    /* Proportional share, with the last order taking the rounding remainder so
       the parts always add up to exactly what was quoted. */
    const share = totalDiscount === 0
      ? 0
      : gi === groupList.length - 1
        ? discountRemaining
        : Math.min(discountRemaining, Math.floor((totalDiscount * g.subtotal) / basketSubtotal));
    discountRemaining -= share;
    const ref = reference();
    const [order] = await db.insert(orders).values({
      reference: ref,
      customerId,
      shopId: g.shopId,
      status: "pending",
      subtotalCents: g.subtotal,
      deliveryFeeCents: g.deliveryFee,
      // Never below the delivery fee, and never negative.
      totalCents: Math.max(g.deliveryFee, g.total - share),
      discountCodeId: discount?.ok ? discount.codeId : null,
      discountCode: discount?.ok ? discount.code : null,
      discountCents: share,
      paymentMethod: method.code,
      paymentStatus: "awaiting_payment",
      paymentDestination: method.destination ?? null,
      contactEmail: email,
      contactPhone: phone || null,
      deliveryAddress: address,
      deliveryState: state,
      deliveryNotes: notes || null,
    }).returning();

    const lineValues = g.lines.map((l) => ({
      orderId: order.id,
      productId: l.p.id,
      nameSnapshot: l.p.name,
      brandSnapshot: l.p.brand,
      unitPriceCents: l.p.priceCents,
      qty: l.qty,
    }));
    await db.insert(orderItems).values(lineValues);

    /* Take the stock.

       Only for products that are actually counted. A null stockQty means
       nobody is tracking that line, and decrementing null would turn
       "untracked" into "out of stock" on its first sale.

       greatest(..., 0) means two checkouts racing for the last unit can
       leave stock at zero but never below it. For a shop where payment is
       confirmed by hand that is the right failure: an operator cancels an
       order they cannot fill, which is recoverable. Silently going negative
       is not, because nothing downstream would ever notice. */
    for (const l of g.lines) {
      await db.update(products)
        .set({ stockQty: sql`greatest(${products.stockQty} - ${l.qty}, 0)` })
        .where(and(eq(products.id, l.p.id), isNotNull(products.stockQty)));
    }

    await notifyNewOrder(
      {
        ...order,
        customerName: name,
        shopName: g.shopName,
        paymentMethodLabel: method.label,
        paymentNetwork: method.network,
      },
      lineValues
    );

    created.push({ ref, orderId: order.id, share });
  }

  /* Record the redemption once the orders exist.

     After, not before: a code must not be counted as used by an order that
     failed to write. The row is what enforces the per-customer limit, so it
     carries the address the limit is checked against. */
  if (discount?.ok && totalDiscount > 0) {
    await recordRedemption({
      codeId: discount.codeId,
      orderId: created[0]?.orderId ?? null,
      email,
      amountCents: totalDiscount,
    });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin");

  redirect(`/checkout/${created[0].ref}${created.length > 1 ? `?also=${created.slice(1).map((c) => c.ref).join(",")}` : ""}`);
}
