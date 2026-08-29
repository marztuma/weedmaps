import {
  pgTable, serial, integer, text, varchar, boolean,
  numeric, timestamp, index, uniqueIndex,
} from "drizzle-orm/pg-core";

/* Weedmaps — delivery-only marketplace schema.
   Money is stored in cents as integers; never floats.
   Potency is numeric(5,2) so 28.40 stays 28.40.
   Distances are numeric(4,1) miles. */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  blurb: text("blurb"),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => ({
  sortIdx: index("categories_sort_idx").on(t.sortOrder),
}));

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 64 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => ({
  uniq: uniqueIndex("subcategories_cat_slug_idx").on(t.categoryId, t.slug),
  catIdx: index("subcategories_category_idx").on(t.categoryId),
}));

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 96 }).notNull(),
  kind: varchar("kind", { length: 96 }),
  blurb: text("blurb"),
  featured: boolean("featured").notNull().default(false),
  // Brand identity art. A wide banner heads the brand page; the square logo
  // marks it in listings. Either may be absent — the page is built to work
  // without both rather than reserving an empty frame.
  logoAvif: text("logo_avif"),
  logoWebp: text("logo_webp"),
  bannerAvif: text("banner_avif"),
  bannerWebp: text("banner_webp"),
  logoCloudId: text("logo_cloud_id"),
  bannerCloudId: text("banner_cloud_id"),
}, (t) => ({
  nameIdx: index("brands_name_idx").on(t.name),
}));

/* Every shop is a delivery service. There is no pickup in this product. */
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),
  name: varchar("name", { length: 96 }).notNull(),
  serviceArea: varchar("service_area", { length: 96 }).notNull(),
  license: varchar("license", { length: 64 }).notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull().default(0),
  deliveringNow: boolean("delivering_now").notNull().default(true),
  windowLabel: varchar("window_label", { length: 64 }).notNull(),
  etaMinMinutes: integer("eta_min_minutes").notNull(),
  etaMaxMinutes: integer("eta_max_minutes").notNull(),
  minOrderCents: integer("min_order_cents").notNull().default(0),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  freeDeliveryOverCents: integer("free_delivery_over_cents"),
  menuCount: integer("menu_count").notNull().default(0),
  deal: varchar("deal", { length: 96 }),
}, (t) => ({
  liveIdx: index("shops_delivering_idx").on(t.deliveringNow),
  ratingIdx: index("shops_rating_idx").on(t.rating),
}));

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  brandId: integer("brand_id").notNull().references(() => brands.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
  shopId: integer("shop_id").notNull().references(() => shops.id, { onDelete: "cascade" }),
  strainType: varchar("strain_type", { length: 16 }).notNull(),
  weight: varchar("weight", { length: 24 }).notNull(),
  thc: numeric("thc", { precision: 5, scale: 2 }).notNull(),
  cbd: numeric("cbd", { precision: 5, scale: 2 }).notNull().default("0"),
  priceCents: integer("price_cents").notNull(),
  wasPriceCents: integer("was_price_cents"),
  distanceMi: numeric("distance_mi", { precision: 4, scale: 1 }).notNull(),
  colorway: varchar("colorway", { length: 16 }).notNull().default("linen"),
  // Photography when we have it; the authored package label is the fallback,
  // so a product without a photo still renders as a designed object.
  imageAvif: text("image_avif"),
  imageWebp: text("image_webp"),
  imageAlt: text("image_alt"),
  // Cloudinary public id once uploaded. The delivery URL is derived from this
  // at render time, so transformations can change without a data migration.
  imageCloudId: text("image_cloud_id"),
  // Original copy written for this catalogue from the product's own attributes.
  description: text("description"),
  effects: text("effects").array().notNull().default([]),
  flavors: text("flavors").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  featured: boolean("featured").notNull().default(false),

  /* Stock.

     Null means untracked, not zero. Plenty of a delivery menu is made to order
     or effectively unlimited, and forcing every row to carry a number would
     mean inventing one — then the first thing the admin shows is a count
     nobody set. Null renders as "—" and never blocks an order.

     lowStockAt is per-product because "low" is not one number: five eighths of
     flower is nearly gone, five batteries is a normal shelf. */
  stockQty: integer("stock_qty"),
  lowStockAt: integer("low_stock_at").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  catIdx: index("products_category_idx").on(t.categoryId),
  brandIdx: index("products_brand_idx").on(t.brandId),
  shopIdx: index("products_shop_idx").on(t.shopId),
  priceIdx: index("products_price_idx").on(t.priceCents),
  dealIdx: index("products_deal_idx").on(t.wasPriceCents),
  featuredIdx: index("products_featured_idx").on(t.featured),
}));

/* ─────────────────────────────────────────────────────────────
   Admin + CRM
   ───────────────────────────────────────────────────────────── */

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 160 }).notNull(),
  displayName: varchar("display_name", { length: 96 }).notNull(),
  // scrypt: salt:hash, both hex. Never a plaintext password column.
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 32 }).notNull().default("administrator"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  phone: varchar("phone", { length: 40 }),
  address: text("address"),
  city: varchar("city", { length: 96 }),
  stage: varchar("stage", { length: 32 }).notNull().default("lead"),
  tags: text("tags").array().notNull().default([]),
  ageVerified: boolean("age_verified").notNull().default(false),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  stageIdx: index("customers_stage_idx").on(t.stage),
  nameIdx: index("customers_name_idx").on(t.name),
}));

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").references(() => shops.id, { onDelete: "set null" }),
  status: varchar("status", { length: 24 }).notNull().default("pending"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),

  // checkout
  paymentMethod: varchar("payment_method", { length: 32 }),
  paymentStatus: varchar("payment_status", { length: 24 }).notNull().default("awaiting_payment"),
  paymentDestination: text("payment_destination"),
  paymentReference: varchar("payment_reference", { length: 96 }),
  paymentConfirmedAt: timestamp("payment_confirmed_at", { withTimezone: true }),
  paymentConfirmedBy: varchar("payment_confirmed_by", { length: 96 }),
  contactEmail: varchar("contact_email", { length: 160 }),
  contactPhone: varchar("contact_phone", { length: 40 }),
  deliveryAddress: text("delivery_address"),
  deliveryNotes: text("delivery_notes"),
}, (t) => ({
  statusIdx: index("orders_status_idx").on(t.status),
  customerIdx: index("orders_customer_idx").on(t.customerId),
  placedIdx: index("orders_placed_idx").on(t.placedAt),
  payStatusIdx: index("orders_payment_status_idx").on(t.paymentStatus),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  nameSnapshot: varchar("name_snapshot", { length: 160 }).notNull(),
  brandSnapshot: varchar("brand_snapshot", { length: 96 }),
  unitPriceCents: integer("unit_price_cents").notNull(),
  qty: integer("qty").notNull().default(1),
}, (t) => ({
  orderIdx: index("order_items_order_idx").on(t.orderId),
}));

export const customerNotes = pgTable("customer_notes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  authorId: integer("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
  authorName: varchar("author_name", { length: 96 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  customerIdx: index("customer_notes_customer_idx").on(t.customerId),
}));

/* ─────────────────────────────────────────────────────────────
   Checkout & payments

   None of these rails can confirm themselves. Crypto, Cash App and Zelle are
   push payments with no callback into this site, so an order stays
   `awaiting_payment` until an administrator confirms receipt by hand. There is
   deliberately no code path that marks an order paid automatically.
   ───────────────────────────────────────────────────────────── */

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  kind: varchar("kind", { length: 16 }).notNull(),          // "app" | "crypto"
  label: varchar("label", { length: 64 }).notNull(),
  network: varchar("network", { length: 48 }),              // Bitcoin, Tron (TRC20), Ethereum (ERC20)
  asset: varchar("asset", { length: 24 }),                  // BTC, USDT…
  // Wallet address or the Cash App tag / Zelle handle.
  destination: text("destination"),
  instructions: text("instructions"),
  confirmations: integer("confirmations"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  activeIdx: index("payment_methods_active_idx").on(t.active),
}));

export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 32 }).notNull().default("order"),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body"),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at", { withTimezone: true }),
  emailedAt: timestamp("emailed_at", { withTimezone: true }),
  emailError: text("email_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unreadIdx: index("admin_notifications_unread_idx").on(t.readAt),
}));

/* An audit trail. Bulk deletes remove customers, their orders and their notes
   in one click; without a record of who did that and when, a mistake is
   unattributable and an argument is unresolvable. Written by the actions
   themselves, never editable from the UI. */
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actor: varchar("actor", { length: 96 }).notNull(),
  action: varchar("action", { length: 48 }).notNull(),
  entity: varchar("entity", { length: 32 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  summary: text("summary").notNull(),
  severity: varchar("severity", { length: 16 }).notNull().default("info"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdIdx: index("audit_log_created_idx").on(t.createdAt),
  entityIdx: index("audit_log_entity_idx").on(t.entity),
}));

/* ─────────────────────────────────────────────────────────────
   Reviews

   Modelled on how the reference marketplace does it, because the distinction
   it draws is a real one: a rating and a review are not the same object. Most
   people leave a star and nothing else, so `body` is nullable and a listing
   reports "N ratings · M reviews" — M being the subset that bothered to write.

   Reviews attach to a product or to a delivery service, never both, and the
   check constraint that would enforce that lives in the query layer here
   rather than the DDL, because drizzle-kit push does not carry CHECK cleanly.

   Everything arrives as `pending`. Nothing a stranger typed reaches a public
   page without a human passing it, which is the whole point of having an
   admin. Status is also how a review gets taken down after the fact without
   destroying the record of it having existed. */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),

  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  shopId: integer("shop_id").references(() => shops.id, { onDelete: "cascade" }),

  rating: integer("rating").notNull(),          // 1..5, validated on write
  title: varchar("title", { length: 120 }),
  body: text("body"),                            // null = a rating with no words

  authorHandle: varchar("author_handle", { length: 48 }).notNull(),
  authorLocation: varchar("author_location", { length: 96 }),

  // pending | published | rejected
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  moderatedBy: varchar("moderated_by", { length: 96 }),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),

  /* Marks rows created by scripts/seed-reviews.mjs rather than typed by a
     person. Without this there is no way to tell demonstration content from
     the real thing once both are in the same table — and no way to clear one
     without the other. */
  seeded: boolean("seeded").notNull().default(false),

  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  productIdx: index("reviews_product_idx").on(t.productId),
  shopIdx: index("reviews_shop_idx").on(t.shopId),
  statusIdx: index("reviews_status_idx").on(t.status),
  createdIdx: index("reviews_created_idx").on(t.createdAt),
}));
