"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, inArray, sql, isNull as sqlIsNull, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { authenticate, createSession, destroySession, getSession } from "@/lib/auth";
import { audit, auditDestructive } from "@/lib/audit";
import { notifyPaymentConfirmed, notifyNewReview } from "@/lib/notify";

const { products, categories, subcategories, brands, shops, customers, customerNotes, orders } = schema;

/** Every mutation goes through this. No action trusts the caller. */
async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

const slugify = (s) =>
  String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .trim().replace(/\s+/g, "-").slice(0, 150);

const str = (fd, k) => String(fd.get(k) ?? "").trim();
const num = (fd, k, fallback = 0) => {
  const v = Number(String(fd.get(k) ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(v) ? v : fallback;
};
const bool = (fd, k) => fd.get(k) === "on" || fd.get(k) === "true";

/* ── Auth ──────────────────────────────────────────────────── */

export async function login(_prev, formData) {
  const result = await authenticate(formData.get("username"), formData.get("password"));
  if (!result.ok) return { error: result.error };
  await createSession(result.user);
  await audit({ actor: result.user.displayName, action: "login", entity: "session", summary: "Signed in to the admin." });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

/* ── Products ──────────────────────────────────────────────── */

function productFields(fd) {
  const name = str(fd, "name");
  const price = num(fd, "price");
  const was = str(fd, "was") ? num(fd, "was") : null;
  return {
    name,
    brandId: num(fd, "brandId") || null,
    categoryId: num(fd, "categoryId") || null,
    subcategoryId: num(fd, "subcategoryId") || null,
    shopId: num(fd, "shopId") || null,
    strainType: str(fd, "strainType") || "Hybrid",
    weight: str(fd, "weight") || "1g",
    thc: String(num(fd, "thc")),
    cbd: String(num(fd, "cbd")),
    priceCents: Math.round(price * 100),
    wasPriceCents: was != null ? Math.round(was * 100) : null,
    distanceMi: String(num(fd, "distance", 2)),
    colorway: str(fd, "colorway") || "linen",
    description: str(fd, "description") || null,
    effects: str(fd, "effects") ? str(fd, "effects").split(",").map((t) => t.trim()).filter(Boolean) : [],
    flavors: str(fd, "flavors") ? str(fd, "flavors").split(",").map((t) => t.trim()).filter(Boolean) : [],
    imageAvif: str(fd, "imageAvif") || null,
    imageWebp: str(fd, "imageWebp") || null,
    tags: str(fd, "tags") ? str(fd, "tags").split(",").map((t) => t.trim()).filter(Boolean) : [],
    featured: bool(fd, "featured"),
    /* An empty stock box means untracked, not zero. num() would turn "" into 0
       and quietly mark the product sold out, so the empty case is handled
       before it ever reaches the number. */
    stockQty: str(fd, "stockQty") === "" ? null : Math.max(0, num(fd, "stockQty")),
    lowStockAt: Math.max(0, num(fd, "lowStockAt", 5)) || 5,
  };
}

function validateProduct(f) {
  const errors = [];
  if (!f.name) errors.push("Product name is required.");
  if (!f.brandId) errors.push("Choose a brand.");
  if (!f.categoryId) errors.push("Choose a category.");
  if (!f.shopId) errors.push("Choose a delivery service.");
  if (!(f.priceCents > 0)) errors.push("Price must be greater than zero.");
  if (f.wasPriceCents != null && f.wasPriceCents <= f.priceCents) {
    errors.push("The “was” price must be higher than the current price, or left empty.");
  }
  if (Number(f.thc) < 0 || Number(f.thc) > 100) errors.push("THC must be between 0 and 100.");
  if (Number(f.cbd) < 0 || Number(f.cbd) > 100) errors.push("CBD must be between 0 and 100.");
  return errors;
}

export async function createProduct(_prev, formData) {
  await requireSession();
  const f = productFields(formData);
  const errors = validateProduct(f);
  if (errors.length) return { errors, values: Object.fromEntries(formData) };

  const [cat] = await db.select({ slug: categories.slug }).from(categories)
    .where(eq(categories.id, f.categoryId)).limit(1);
  const [brand] = await db.select({ name: brands.name }).from(brands)
    .where(eq(brands.id, f.brandId)).limit(1);

  let slug = `${cat?.slug ?? "item"}-${slugify(brand?.name ?? "brand")}-${slugify(f.name)}`;
  const [clash] = await db.select({ id: products.id }).from(products)
    .where(eq(products.slug, slug)).limit(1);
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  await db.insert(products).values({ ...f, slug });

  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products?created=1");
}

export async function updateProduct(_prev, formData) {
  await requireSession();
  const id = num(formData, "id");
  if (!id) return { errors: ["Missing product id."] };

  const f = productFields(formData);
  const errors = validateProduct(f);
  if (errors.length) return { errors, values: Object.fromEntries(formData) };

  await db.update(products).set(f).where(eq(products.id, id));

  const [row] = await db.select({ slug: products.slug, category: categories.slug })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id)).limit(1);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/");
  revalidatePath("/products");
  if (row?.slug) revalidatePath(`/product/${row.slug}`);
  if (row?.category) revalidatePath(`/products/${row.category}`);
  return { ok: true, message: "Product updated." };
}

export async function deleteProduct(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (id) {
    const [row] = await db.select({ slug: products.slug, name: products.name }).from(products).where(eq(products.id, id)).limit(1);
    await db.delete(products).where(eq(products.id, id));
    await auditDestructive({ actor: session.name, action: "delete", entity: "product", entityId: id,
      summary: `Deleted product “${row?.name ?? id}”.` });
    if (row?.slug) revalidatePath(`/product/${row.slug}`);
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products?deleted=1");
}

export async function duplicateProduct(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) redirect("/admin/products");
  const { id: _drop, createdAt: _drop2, ...rest } = row;
  await db.insert(products).values({
    ...rest,
    name: `${row.name} (copy)`,
    slug: `${row.slug}-copy-${Date.now().toString(36).slice(-4)}`,
    featured: false,
  });
  revalidatePath("/admin/products");
  redirect("/admin/products?duplicated=1");
}

export async function bulkDeleteProducts(formData) {
  const session = await requireSession();
  const ids = formData.getAll("selected").map(Number).filter(Boolean);
  if (ids.length) {
    await auditDestructive({ actor: session.name, action: "bulk_delete", entity: "product",
      summary: `Deleted ${ids.length} product(s) in bulk.` });
  }
  for (const id of ids) {
    const [row] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, id)).limit(1);
    await db.delete(products).where(eq(products.id, id));
    if (row?.slug) revalidatePath(`/product/${row.slug}`);
  }
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  redirect(`/admin/products?bulk=${ids.length}`);
}

/* ── Brands ────────────────────────────────────────────────── */

export async function saveBrand(_prev, formData) {
  await requireSession();
  const id = num(formData, "id");
  const name = str(formData, "name");
  if (!name) return { errors: ["Brand name is required."] };
  const values = { name, kind: str(formData, "kind") || null, featured: bool(formData, "featured") };

  if (id) {
    await db.update(brands).set(values).where(eq(brands.id, id));
  } else {
    const slug = slugify(name);
    const [clash] = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, slug)).limit(1);
    if (clash) return { errors: [`A brand called “${name}” already exists.`] };
    await db.insert(brands).values({ ...values, slug });
  }
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
  return { ok: true, message: id ? "Brand updated." : "Brand added." };
}

export async function deleteBrand(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (id) await db.delete(brands).where(eq(brands.id, id));
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
  redirect("/admin/brands?deleted=1");
}

/* ── Categories ────────────────────────────────────────────── */

export async function saveCategory(_prev, formData) {
  await requireSession();
  const id = num(formData, "id");
  const name = str(formData, "name");
  if (!name) return { errors: ["Category name is required."] };
  const values = { name, blurb: str(formData, "blurb") || null, sortOrder: num(formData, "sortOrder", 99) };

  if (id) {
    await db.update(categories).set(values).where(eq(categories.id, id));
  } else {
    const slug = slugify(name);
    const [clash] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
    if (clash) return { errors: [`A category called “${name}” already exists.`] };
    await db.insert(categories).values({ ...values, slug });
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  return { ok: true, message: id ? "Category updated." : "Category added." };
}

export async function deleteCategory(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (id) await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  redirect("/admin/categories?deleted=1");
}

export async function addSubcategory(_prev, formData) {
  await requireSession();
  const categoryId = num(formData, "categoryId");
  const name = str(formData, "name");
  if (!categoryId || !name) return { errors: ["Pick a category and enter a name."] };
  const slug = slugify(name);
  const [clash] = await db.select({ id: subcategories.id }).from(subcategories)
    .where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.slug, slug))).limit(1);
  if (clash) return { errors: [`“${name}” already exists in that category.`] };
  await db.insert(subcategories).values({ categoryId, name, slug, sortOrder: 99 });
  revalidatePath("/admin/categories");
  return { ok: true, message: "Subcategory added." };
}

export async function deleteSubcategory(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (id) await db.delete(subcategories).where(eq(subcategories.id, id));
  revalidatePath("/admin/categories");
  redirect("/admin/categories?sub_deleted=1");
}

/* ── Delivery services ─────────────────────────────────────── */

export async function saveShop(_prev, formData) {
  await requireSession();
  const id = num(formData, "id");
  const name = str(formData, "name");
  if (!name) return { errors: ["Service name is required."] };

  const values = {
    name,
    serviceArea: str(formData, "serviceArea") || "—",
    license: str(formData, "license") || "Adult use · C9",
    rating: String(Math.min(5, Math.max(0, num(formData, "rating", 4)))),
    reviewCount: Math.max(0, num(formData, "reviewCount")),
    deliveringNow: bool(formData, "deliveringNow"),
    windowLabel: str(formData, "windowLabel") || "Until 10:00 PM",
    etaMinMinutes: Math.max(0, num(formData, "etaMin", 30)),
    etaMaxMinutes: Math.max(0, num(formData, "etaMax", 60)),
    minOrderCents: Math.round(num(formData, "minOrder") * 100),
    deliveryFeeCents: Math.round(num(formData, "fee") * 100),
    freeDeliveryOverCents: str(formData, "freeOver") ? Math.round(num(formData, "freeOver") * 100) : null,
    deal: str(formData, "deal") || null,
  };
  if (values.etaMaxMinutes < values.etaMinMinutes) {
    return { errors: ["The maximum arrival time cannot be lower than the minimum."] };
  }

  if (id) {
    await db.update(shops).set(values).where(eq(shops.id, id));
  } else {
    await db.insert(shops).values({ ...values, slug: slugify(name), menuCount: 0 });
  }
  revalidatePath("/admin/deliveries");
  revalidatePath("/deliveries");
  return { ok: true, message: id ? "Delivery service updated." : "Delivery service added." };
}

export async function deleteShop(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (id) await db.delete(shops).where(eq(shops.id, id));
  revalidatePath("/admin/deliveries");
  revalidatePath("/deliveries");
  redirect("/admin/deliveries?deleted=1");
}

/* ── CRM ───────────────────────────────────────────────────── */

export async function saveCustomer(_prev, formData) {
  await requireSession();
  const id = num(formData, "id");
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  if (!name) return { errors: ["Customer name is required."] };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { errors: ["Enter a valid email address."] };

  const values = {
    name, email,
    phone: str(formData, "phone") || null,
    address: str(formData, "address") || null,
    city: str(formData, "city") || null,
    stage: str(formData, "stage") || "lead",
    tags: str(formData, "tags") ? str(formData, "tags").split(",").map((t) => t.trim()).filter(Boolean) : [],
    ageVerified: bool(formData, "ageVerified"),
    marketingOptIn: bool(formData, "marketingOptIn"),
    notes: str(formData, "notes") || null,
  };

  if (id) {
    await db.update(customers).set(values).where(eq(customers.id, id));
  } else {
    const [clash] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, email)).limit(1);
    if (clash) return { errors: [`A customer with ${email} already exists.`] };
    await db.insert(customers).values(values);
  }
  revalidatePath("/admin/customers");
  return { ok: true, message: id ? "Customer updated." : "Customer added." };
}

export async function deleteCustomer(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (id) {
    const [row] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, id)).limit(1);
    await db.delete(customers).where(eq(customers.id, id));
    await auditDestructive({ actor: session.name, action: "delete", entity: "customer", entityId: id,
      summary: `Deleted customer ${row?.name ?? id} with their orders and notes.` });
  }
  revalidatePath("/admin/customers");
  redirect("/admin/customers?deleted=1");
}

export async function addNote(_prev, formData) {
  const session = await requireSession();
  const customerId = num(formData, "customerId");
  const body = str(formData, "body");
  if (!customerId || !body) return { errors: ["Write something before saving the note."] };
  await db.insert(customerNotes).values({
    customerId, body, authorId: session.uid, authorName: session.name,
  });
  revalidatePath(`/admin/customers/${customerId}`);
  return { ok: true, message: "Note added." };
}

export async function setOrderStatus(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const allowed = ["pending", "confirmed", "out_for_delivery", "delivered", "cancelled"];
  if (id && allowed.includes(status)) {
    await db.update(orders)
      .set({ status, deliveredAt: status === "delivered" ? new Date() : null })
      .where(eq(orders.id, id));
  }
  revalidatePath("/admin/orders");
  return { ok: true };
}

/* ── Payments ──────────────────────────────────────────────── */

const CRYPTO_RULES = {
  btc: [/^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[02-9ac-hj-np-z]{11,71})$/, "a Bitcoin address (starts 1, 3 or bc1)"],
  usdt_trc20: [/^T[1-9A-HJ-NP-Za-km-z]{33}$/, "a Tron TRC20 address (starts T, 34 characters)"],
  usdt_erc20: [/^0x[0-9a-fA-F]{40}$/, "an Ethereum ERC20 address (0x + 40 hex characters)"],
};

export async function savePaymentMethod(_prev, formData) {
  await requireSession();
  const id = num(formData, "id");
  if (!id) return { errors: ["Missing payment method."] };

  const [row] = await db.select().from(schema.paymentMethods)
    .where(eq(schema.paymentMethods.id, id)).limit(1);
  if (!row) return { errors: ["Unknown payment method."] };

  const destination = str(formData, "destination");

  // A mistyped wallet sends customer money somewhere nobody can retrieve it,
  // so the format is checked before it is ever shown at checkout.
  const rule = CRYPTO_RULES[row.code];
  if (rule && destination && !rule[0].test(destination)) {
    return { errors: [`That does not look like ${rule[1]}. Nothing was saved.`] };
  }
  if (row.kind === "crypto" && bool(formData, "active") && !destination) {
    return { errors: ["A crypto method cannot be active without an address."] };
  }

  await db.update(schema.paymentMethods).set({
    destination: destination || null,
    instructions: str(formData, "instructions") || null,
    confirmations: str(formData, "confirmations") ? num(formData, "confirmations") : null,
    active: bool(formData, "active"),
    updatedAt: new Date(),
  }).where(eq(schema.paymentMethods.id, id));

  const changedAddress = (row.destination ?? "") !== (destination || "");
  await audit({
    actor: (await getSession())?.name ?? "unknown",
    action: "update", entity: "payment_method", entityId: id,
    severity: changedAddress ? "money" : "info",
    summary: changedAddress
      ? `Changed the ${row.label} destination from ${row.destination ?? "(none)"} to ${destination || "(none)"}.`
      : `Updated ${row.label} settings.`,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/checkout");
  return { ok: true, message: `${row.label} updated.` };
}

/** Mark funds as actually received. Only a human ever calls this. */
export async function confirmPayment(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const next = String(formData.get("paymentStatus") ?? "");
  const allowed = ["awaiting_payment", "paid", "failed", "refunded"];
  if (!id || !allowed.includes(next)) return;

  await db.update(orders).set({
    paymentStatus: next,
    paymentReference: String(formData.get("paymentReference") ?? "").trim() || null,
    paymentConfirmedAt: next === "paid" ? new Date() : null,
    paymentConfirmedBy: next === "paid" ? session.name : null,
    // Confirming payment moves fulfilment forward, but never past it.
    status: next === "paid" ? "confirmed" : next === "failed" ? "cancelled" : "pending",
  }).where(eq(orders.id, id));

  const [row] = await db.select({
    reference: orders.reference, total: orders.totalCents, customerId: orders.customerId,
    contactEmail: orders.contactEmail, deliveryAddress: orders.deliveryAddress,
    shopName: shops.name,
  }).from(orders)
    .leftJoin(shops, eq(orders.shopId, shops.id))
    .where(eq(orders.id, id)).limit(1);

  /* Tell the customer their money landed.

     Only on the transition to paid, and only ever from a human pressing this
     button — none of these payment rails confirms itself. The send is
     best-effort and idempotent on the order id, so pressing twice does not
     mail twice, and a mail failure cannot undo a confirmed payment. */
  if (next === "paid" && row?.contactEmail) {
    await notifyPaymentConfirmed({
      id,
      reference: row.reference,
      totalCents: row.total,
      contactEmail: row.contactEmail,
      deliveryAddress: row.deliveryAddress,
      shopName: row.shopName,
    });
  }

  /* Move the customer along the pipeline automatically when a payment lands.
     Stages are derived from paid orders, so the CRM reflects behaviour instead
     of waiting for someone to remember. VIP is spend-based, not count-based —
     three small orders is not the same customer as one large one. A stage set
     by hand to "lapsed" is left alone; that is a judgement, not a count. */
  if (next === "paid" && row?.customerId) {
    const [stats] = await db.select({
      paid: sql`count(*) filter (where ${orders.paymentStatus} = 'paid')`.mapWith(Number),
      spend: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.paymentStatus} = 'paid'), 0)`.mapWith(Number),
    }).from(orders).where(eq(orders.customerId, row.customerId));

    const [cust] = await db.select({ stage: customers.stage, name: customers.name })
      .from(customers).where(eq(customers.id, row.customerId)).limit(1);

    const derived =
      stats.spend >= 50000 ? "vip" :
      stats.paid >= 3 ? "repeat" :
      stats.paid >= 1 ? "first_order" : "lead";

    if (cust && cust.stage !== derived && cust.stage !== "lapsed") {
      await db.update(customers).set({ stage: derived }).where(eq(customers.id, row.customerId));
      await audit({
        actor: "system", action: "stage_change", entity: "customer", entityId: row.customerId,
        summary: `${cust.name} moved ${cust.stage} → ${derived} after ${stats.paid} paid order(s), $${(stats.spend / 100).toFixed(2)} lifetime.`,
      });
      revalidatePath("/admin/customers");
    }
  }
  await audit({
    actor: session.name,
    action: next === "paid" ? "confirm_payment" : `payment_${next}`,
    entity: "order", entityId: id,
    severity: next === "paid" ? "money" : "info",
    summary: next === "paid"
      ? `Confirmed payment of ${((row?.total ?? 0) / 100).toFixed(2)} on ${row?.reference}.`
      : `Set payment on ${row?.reference} to ${next.replace(/_/g, " ")}.`,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function markNotificationsRead() {
  await requireSession();
  await db.update(schema.adminNotifications)
    .set({ readAt: new Date() })
    .where(sqlIsNull(schema.adminNotifications.readAt));
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
}

/* ── CRM bulk actions ──────────────────────────────────────── */

const CUSTOMER_STAGES = ["lead", "first_order", "repeat", "vip", "lapsed"];

/**
 * Apply one action to every ticked customer. Deleting a customer takes their
 * orders and notes with it, so the count is reported back rather than the
 * screen silently changing.
 */
export async function bulkCustomerAction(formData) {
  const session = await requireSession();
  const ids = formData.getAll("selected").map(Number).filter(Boolean);
  const action = String(formData.get("bulkAction") ?? "");

  if (!ids.length || !action) redirect("/admin/customers?bulk_none=1");

  if (action === "delete") {
    const doomed = await db.select({ name: customers.name }).from(customers).where(inArray(customers.id, ids));
    await db.delete(customers).where(inArray(customers.id, ids));
    await auditDestructive({ actor: session.name, action: "bulk_delete", entity: "customer",
      summary: `Deleted ${ids.length} customer(s) with their orders and notes: ${doomed.map((d) => d.name).slice(0, 6).join(", ")}${doomed.length > 6 ? "…" : ""}.` });
    revalidatePath("/admin/customers");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    redirect(`/admin/customers?bulk_deleted=${ids.length}`);
  }

  if (action.startsWith("stage:")) {
    const stage = action.slice(6);
    if (!CUSTOMER_STAGES.includes(stage)) redirect("/admin/customers");
    await db.update(customers).set({ stage }).where(inArray(customers.id, ids));
    revalidatePath("/admin/customers");
    redirect(`/admin/customers?bulk_staged=${ids.length}`);
  }

  if (action === "verify" || action === "unverify") {
    await db.update(customers)
      .set({ ageVerified: action === "verify" })
      .where(inArray(customers.id, ids));
    revalidatePath("/admin/customers");
    redirect(`/admin/customers?bulk_verified=${ids.length}`);
  }

  redirect("/admin/customers");
}

/** Same shape for orders. Cancelling is offered before deleting, deliberately. */
export async function bulkOrderAction(formData) {
  const session = await requireSession();
  const ids = formData.getAll("selected").map(Number).filter(Boolean);
  const action = String(formData.get("bulkAction") ?? "");

  if (!ids.length || !action) redirect("/admin/orders?bulk_none=1");

  if (action === "delete") {
    await auditDestructive({ actor: session.name, action: "bulk_delete", entity: "order",
      summary: `Deleted ${ids.length} order(s) in bulk.` });
    await db.delete(orders).where(inArray(orders.id, ids));
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    redirect(`/admin/orders?bulk_deleted=${ids.length}`);
  }

  if (action === "cancel") {
    await db.update(orders)
      .set({ status: "cancelled", paymentStatus: "failed" })
      .where(inArray(orders.id, ids));
    revalidatePath("/admin/orders");
    redirect(`/admin/orders?bulk_cancelled=${ids.length}`);
  }

  if (action === "mark_delivered") {
    await db.update(orders)
      .set({ status: "delivered", deliveredAt: new Date() })
      .where(inArray(orders.id, ids));
    revalidatePath("/admin/orders");
    redirect(`/admin/orders?bulk_delivered=${ids.length}`);
  }

  redirect("/admin/orders");
}

/* ── Reviews ──────────────────────────────────────────────────

   Moderation is the whole point of the queue: nothing a stranger typed
   reaches a public page until someone here passes it. Rejecting keeps the row
   so the decision is auditable and reversible; deleting is the only
   irreversible option and is treated as destructive. */

async function setReviewStatus(ids, status, session) {
  await db
    .update(schema.reviews)
    .set({ status, moderatedBy: session.name, moderatedAt: new Date() })
    .where(inArray(schema.reviews.id, ids));

  // A published review changes an average, so the pages that quote one are stale.
  const targets = await db
    .select({
      productSlug: products.slug,
      shopSlug: shops.slug,
    })
    .from(schema.reviews)
    .leftJoin(products, eq(schema.reviews.productId, products.id))
    .leftJoin(shops, eq(schema.reviews.shopId, shops.id))
    .where(inArray(schema.reviews.id, ids));

  for (const t of targets) {
    if (t.productSlug) revalidatePath(`/product/${t.productSlug}`);
    if (t.shopSlug) revalidatePath(`/delivery/${t.shopSlug}`);
  }
  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

export async function moderateReview(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["publish", "reject"].includes(decision)) redirect("/admin/reviews");

  const status = decision === "publish" ? "published" : "rejected";
  await setReviewStatus([id], status, session);

  await audit({
    actor: session.name,
    action: decision,
    entity: "review",
    entityId: String(id),
    summary: `Review ${id} ${status}.`,
  });

  redirect(`/admin/reviews?status=${status === "published" ? "published" : "rejected"}&done=1`);
}

export async function deleteReview(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/reviews");

  await auditDestructive({
    actor: session.name,
    action: "delete",
    entity: "review",
    entityId: String(id),
    summary: `Deleted review ${id} permanently.`,
  });
  await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?deleted=1");
}

export async function bulkReviewAction(formData) {
  const session = await requireSession();
  const ids = formData.getAll("selected").map(Number).filter(Boolean);
  const action = String(formData.get("bulkAction") ?? "");
  if (!ids.length || !action) redirect("/admin/reviews?bulk_none=1");

  if (action === "delete") {
    await auditDestructive({
      actor: session.name,
      action: "bulk_delete",
      entity: "review",
      summary: `Deleted ${ids.length} review(s) permanently.`,
    });
    await db.delete(schema.reviews).where(inArray(schema.reviews.id, ids));
    revalidatePath("/admin/reviews");
    revalidatePath("/admin");
    redirect(`/admin/reviews?bulk_deleted=${ids.length}`);
  }

  if (action === "publish" || action === "reject") {
    const status = action === "publish" ? "published" : "rejected";
    await setReviewStatus(ids, status, session);
    await audit({
      actor: session.name,
      action: `bulk_${action}`,
      entity: "review",
      summary: `${status === "published" ? "Published" : "Rejected"} ${ids.length} review(s).`,
    });
    redirect(`/admin/reviews?status=${status}&bulk_done=${ids.length}`);
  }

  redirect("/admin/reviews");
}

/* ── Email ────────────────────────────────────────────────── */

/** Send a test message.
 *
 *  It goes to ADMIN_EMAIL and nowhere else. There is deliberately no field to
 *  type a recipient into: a form that mails an arbitrary address, behind a
 *  login or not, is a spam relay with one credential between it and the world. */
export async function sendTestEmail() {
  const session = await requireSession();
  const { sendMail, adminRecipient, mailConfigured } = await import("@/lib/mail/send");

  if (!mailConfigured()) redirect("/admin/email?not_configured=1");
  const to = adminRecipient();
  if (!to) redirect("/admin/email?not_configured=1");

  const stamp = new Date().toISOString();
  const result = await sendMail({
    template: "test",
    to,
    subject: "Weedmaps — email is working",
    html: `<p style="font-family:sans-serif;font-size:15px;">Email is configured correctly. Sent from the admin by ${session.name} at ${stamp}.</p>`,
    text: `Email is configured correctly.\n\nSent from the admin by ${session.name} at ${stamp}.`,
    // Timestamped so a second test is a second email rather than a duplicate
    // collapsed by the idempotency key.
    key: `test:${stamp}`,
  });

  await audit({
    actor: session.name, action: "test_email", entity: "email",
    summary: result.sent ? "Sent a test email." : `Test email failed: ${result.reason}.`,
  });

  revalidatePath("/admin/email");
  redirect(result.sent ? "/admin/email?test_sent=1" : "/admin/email?test_failed=1");
}

/** Take an address off the suppression list.
 *
 *  Destructive in the direction that matters: the address is there because it
 *  bounced or somebody reported spam, and mailing it again risks the sending
 *  domain's reputation. Audited so the decision has a name against it. */
export async function unsuppressAddress(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/email");

  const [row] = await db.select({ email: schema.emailSuppressions.email, reason: schema.emailSuppressions.reason })
    .from(schema.emailSuppressions).where(eq(schema.emailSuppressions.id, id)).limit(1);

  await db.delete(schema.emailSuppressions).where(eq(schema.emailSuppressions.id, id));

  if (row) {
    const { maskEmail } = await import("@/lib/mail/safe");
    await auditDestructive({
      actor: session.name, action: "unsuppress", entity: "email", entityId: String(id),
      summary: `Removed ${maskEmail(row.email)} from the suppression list (was ${row.reason}).`,
    });
  }

  revalidatePath("/admin/email");
  redirect("/admin/email?unsuppressed=1");
}

/* ── Subscribers ──────────────────────────────────────────── */

export async function removeSubscriber(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/subscribers");

  const [row] = await db.select({ email: schema.subscribers.email })
    .from(schema.subscribers).where(eq(schema.subscribers.id, id)).limit(1);

  await db.delete(schema.subscribers).where(eq(schema.subscribers.id, id));

  if (row) {
    const { maskEmail } = await import("@/lib/mail/safe");
    await auditDestructive({
      actor: session.name, action: "delete", entity: "subscriber", entityId: String(id),
      summary: `Deleted subscriber ${maskEmail(row.email)}, losing the record of their consent and any unsubscribe.`,
    });
  }
  revalidatePath("/admin/subscribers");
  redirect("/admin/subscribers?removed=1");
}

/** CSV of mailable subscribers.
 *
 *  Only rows with recorded consent are exported. An export is how a list
 *  leaves this system and ends up in another tool, and a row without consent
 *  must not be the one that gets mailed from somewhere with no such check. */
export async function exportSubscribers() {
  const session = await requireSession();
  await audit({
    actor: session.name, action: "export", entity: "subscriber",
    summary: "Exported the consented subscriber list.",
  });
  redirect("/admin/export?type=subscribers");
}

/* ── Discount codes ───────────────────────────────────────── */

function discountFields(fd) {
  const kind = String(fd.get("kind") ?? "percent") === "fixed" ? "fixed" : "percent";
  const raw = Number(String(fd.get("value") ?? "").trim());
  if (!Number.isFinite(raw) || raw <= 0) return null;

  // Percent stays whole points; fixed converts dollars to cents.
  const value = kind === "percent" ? Math.round(raw) : Math.round(raw * 100);
  if (kind === "percent" && (value < 1 || value > 100)) return null;

  const dollarsToCents = (k, fallback = null) => {
    const v = String(fd.get(k) ?? "").trim();
    if (!v) return fallback;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : fallback;
  };
  const intOrNull = (k) => {
    const v = String(fd.get(k) ?? "").trim();
    if (!v) return null;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const dateOrNull = (k) => {
    const v = String(fd.get(k) ?? "").trim();
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const code = String(fd.get("code") ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 32);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return null;

  return {
    code,
    description: String(fd.get("description") ?? "").trim().slice(0, 160) || null,
    kind,
    value,
    minSubtotalCents: dollarsToCents("minSubtotal", 0) ?? 0,
    maxDiscountCents: dollarsToCents("maxDiscount", null),
    usageLimit: intOrNull("usageLimit"),
    perCustomerLimit: intOrNull("perCustomer") ?? 1,
    startsAt: dateOrNull("startsAt"),
    endsAt: dateOrNull("endsAt"),
    active: fd.get("active") === "on",
  };
}

export async function saveDiscountCode(formData) {
  const session = await requireSession();
  const fields = discountFields(formData);
  if (!fields) redirect("/admin/discounts?invalid=1");

  const id = Number(formData.get("id")) || null;

  try {
    if (id) {
      await db.update(schema.discountCodes).set(fields).where(eq(schema.discountCodes.id, id));
    } else {
      await db.insert(schema.discountCodes).values(fields);
    }
  } catch {
    redirect("/admin/discounts?duplicate=1");
  }

  await audit({
    actor: session.name, action: id ? "update" : "create", entity: "discount",
    entityId: fields.code,
    summary: `${id ? "Updated" : "Created"} ${fields.code}: ${fields.kind === "percent" ? `${fields.value}%` : `$${(fields.value / 100).toFixed(2)}`} off.`,
  });

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?saved=1");
}

export async function toggleDiscountCode(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/discounts");

  const [row] = await db.select({ code: schema.discountCodes.code, active: schema.discountCodes.active })
    .from(schema.discountCodes).where(eq(schema.discountCodes.id, id)).limit(1);
  if (!row) redirect("/admin/discounts");

  await db.update(schema.discountCodes).set({ active: !row.active })
    .where(eq(schema.discountCodes.id, id));

  await audit({
    actor: session.name, action: row.active ? "disable" : "enable", entity: "discount",
    entityId: row.code, summary: `${row.active ? "Turned off" : "Turned on"} ${row.code}.`,
  });

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?toggled=1");
}

export async function deleteDiscountCode(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/discounts");

  const [row] = await db.select({ code: schema.discountCodes.code })
    .from(schema.discountCodes).where(eq(schema.discountCodes.id, id)).limit(1);

  await auditDestructive({
    actor: session.name, action: "delete", entity: "discount", entityId: row?.code,
    summary: `Deleted ${row?.code ?? id} and its redemption history.`,
  });
  await db.delete(schema.discountCodes).where(eq(schema.discountCodes.id, id));

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?deleted=1");
}

/* ── Messages ─────────────────────────────────────────────── */

export async function closeConversation(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/messages");
  await db.update(schema.chatConversations).set({ status: "closed" })
    .where(eq(schema.chatConversations.id, id));
  revalidatePath("/admin/messages");
  redirect("/admin/messages?closed=1");
}

/* ── Campaigns ────────────────────────────────────────────── */

export async function saveCampaign(formData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim().slice(0, 20000);
  if (!name || !subject || !body) redirect("/admin/campaigns?invalid=1");

  const id = Number(formData.get("id")) || null;
  if (id) {
    await db.update(schema.campaigns).set({ name, subject, body })
      .where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.status, "draft")));
  } else {
    await db.insert(schema.campaigns).values({ name, subject, body, createdBy: session.name });
  }
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns?saved=1");
}

export async function deleteCampaign(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/campaigns");
  await auditDestructive({
    actor: session.name, action: "delete", entity: "campaign", entityId: String(id),
    summary: `Deleted campaign ${id}.`,
  });
  await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id));
  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns?deleted=1");
}

/** Send a campaign.
 *
 *  Recipients are selected in the query, not filtered afterwards: subscribed,
 *  and carrying a consent timestamp. A row missing either cannot be reached by
 *  this code path at all, which is a stronger guarantee than remembering to
 *  check.
 *
 *  Every message carries that subscriber's own unsubscribe link. Marketing
 *  email without one is unlawful under CAN-SPAM, and practically it is the
 *  difference between someone leaving the list and someone reporting the
 *  domain as spam. */
export async function sendCampaign(formData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  if (!id) redirect("/admin/campaigns");

  const { sendMail, mailConfigured } = await import("@/lib/mail/send");
  const { campaignEmail } = await import("@/lib/mail/templates");
  const { SITE_URL } = await import("@/lib/seo");

  if (!mailConfigured()) redirect("/admin/campaigns?not_configured=1");

  const [campaign] = await db.select().from(schema.campaigns)
    .where(and(eq(schema.campaigns.id, id), eq(schema.campaigns.status, "draft"))).limit(1);
  if (!campaign) redirect("/admin/campaigns");

  const recipients = await db
    .select({ email: schema.subscribers.email, token: schema.subscribers.unsubscribeToken })
    .from(schema.subscribers)
    .where(and(
      eq(schema.subscribers.status, "subscribed"),
      isNotNull(schema.subscribers.consentedAt),
    ));

  if (!recipients.length) redirect("/admin/campaigns?no_recipients=1");

  await db.update(schema.campaigns)
    .set({ status: "sending", recipientCount: recipients.length })
    .where(eq(schema.campaigns.id, id));

  let sent = 0, failed = 0;
  for (const r of recipients) {
    const unsub = `${SITE_URL}/unsubscribe?t=${r.token}`;
    const { html, text } = campaignEmail({ body: campaign.body, unsubscribeUrl: unsub });

    const res = await sendMail({
      template: `campaign-${id}`,
      to: r.email,
      subject: campaign.subject,
      html,
      text,
      // One send per subscriber per campaign, however many times this is pressed.
      key: `campaign:${id}:${r.email}`,
    });
    res.sent ? sent++ : failed++;
  }

  await db.update(schema.campaigns)
    .set({ status: failed && !sent ? "failed" : "sent", sentCount: sent, failedCount: failed, sentAt: new Date() })
    .where(eq(schema.campaigns.id, id));

  await audit({
    actor: session.name, action: "send", entity: "campaign", entityId: String(id),
    summary: `Sent "${campaign.name}" to ${sent} subscriber(s), ${failed} failed.`,
  });

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns?sent=1");
}
