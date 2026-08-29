import "server-only";
import { eq, and, sql, desc, asc, isNotNull, inArray } from "drizzle-orm";
import { db, schema } from "./client.js";

const { products, categories, subcategories, brands, shops } = schema;

const money = (cents) => (cents == null ? null : cents / 100);

/* Shape a product row the way the UI reads it — prices as dollars, potency as
   numbers, so no component has to know the storage format. */
const shapeProduct = (r) => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brand: r.brand,
  category: r.category,
  subcategory: r.subcategory,
  type: r.strainType,
  weight: r.weight,
  thc: Number(r.thc),
  cbd: Number(r.cbd),
  price: money(r.priceCents),
  was: money(r.wasPriceCents),
  shop: r.shop,
  shopSlug: r.shopSlug,
  shopFee: money(r.shopFeeCents),
  shopMin: money(r.shopMinCents),
  shopLive: r.shopLive,
  eta: r.etaMinMinutes && r.etaMaxMinutes ? `${r.etaMinMinutes}–${r.etaMaxMinutes} min` : null,
  distance: Number(r.distanceMi),
  colorway: r.colorway,
  /* Stock, shaped so no component has to reason about null.

     tracked=false means nobody is counting, which is not the same as none
     left — it must never render as "out of stock". */
  stock: r.stockQty,
  tracked: r.stockQty != null,
  inStock: r.stockQty == null || r.stockQty > 0,
  lowStock: r.stockQty != null && r.stockQty > 0 && r.stockQty <= (r.lowStockAt ?? 5),
  tags: r.tags ?? [],
  image: (r.imageAvif || r.imageCloudId)
    ? { avif: r.imageAvif, webp: r.imageWebp, alt: r.imageAlt, cloudId: r.imageCloudId }
    : null,
  description: r.description ?? null,
  effects: r.effects ?? [],
  flavors: r.flavors ?? [],
});

const productSelect = {
  id: products.id, slug: products.slug, name: products.name,
  strainType: products.strainType, weight: products.weight,
  thc: products.thc, cbd: products.cbd,
  priceCents: products.priceCents, wasPriceCents: products.wasPriceCents,
  distanceMi: products.distanceMi, colorway: products.colorway, tags: products.tags,
  imageAvif: products.imageAvif, imageWebp: products.imageWebp, imageAlt: products.imageAlt,
  stockQty: products.stockQty, lowStockAt: products.lowStockAt,
  imageCloudId: products.imageCloudId,
  description: products.description, effects: products.effects, flavors: products.flavors,
  brand: brands.name,
  category: categories.slug,
  subcategory: subcategories.name,
  shop: shops.name,
  shopSlug: shops.slug,
  shopFeeCents: shops.deliveryFeeCents,
  shopMinCents: shops.minOrderCents,
  shopLive: shops.deliveringNow,
  etaMinMinutes: shops.etaMinMinutes,
  etaMaxMinutes: shops.etaMaxMinutes,
};

const withJoins = (q) =>
  q.from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(shops, eq(products.shopId, shops.id))
    .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id));

/** One merchandised shelf: products in a category, from services delivering now. */
export async function getShelf(categorySlug, limit = 12) {
  const rows = await withJoins(db.select(productSelect))
    .where(and(eq(categories.slug, categorySlug), eq(shops.deliveringNow, true)))
    .orderBy(desc(products.featured), asc(products.priceCents))
    .limit(limit);
  return rows.map(shapeProduct);
}

/** The category index: every category, its subcategories and a live product count. */
export async function getCategoryIndex() {
  const cats = await db.select({
    slug: categories.slug, name: categories.name, blurb: categories.blurb,
    count: sql`count(distinct ${products.id})`.mapWith(Number),
  })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));

  const subs = await db.select({
    categorySlug: categories.slug, name: subcategories.name, sortOrder: subcategories.sortOrder,
  })
    .from(subcategories)
    .innerJoin(categories, eq(subcategories.categoryId, categories.id))
    .orderBy(asc(subcategories.sortOrder));

  return cats.map((c) => ({
    ...c,
    subs: subs.filter((s) => s.categorySlug === c.slug).map((s) => s.name),
  }));
}

/** Everything discounted right now, deepest cut first. */
export async function getDeals(limit = 6) {
  const rows = await withJoins(db.select(productSelect))
    .where(and(isNotNull(products.wasPriceCents), eq(shops.deliveringNow, true)))
    .orderBy(desc(sql`(${products.wasPriceCents} - ${products.priceCents})::float / ${products.wasPriceCents}`))
    .limit(limit);
  return rows.map(shapeProduct);
}

/** Delivery services. Every shop in this product delivers; none are pickup. */
export async function getShops() {
  const rows = await db.select({
    id: shops.id, slug: shops.slug, name: shops.name,
    area: shops.serviceArea, license: shops.license,
    rating: shops.rating, reviews: shops.reviewCount,
    live: shops.deliveringNow, window: shops.windowLabel,
    etaMin: shops.etaMinMinutes, etaMax: shops.etaMaxMinutes,
    minOrderCents: shops.minOrderCents, feeCents: shops.deliveryFeeCents,
    freeOverCents: shops.freeDeliveryOverCents,
    deal: shops.deal,
    menuCount: sql`count(${products.id})`.mapWith(Number),
  })
    .from(shops)
    .leftJoin(products, eq(products.shopId, shops.id))
    .groupBy(shops.id)
    .orderBy(desc(shops.deliveringNow), asc(shops.etaMinMinutes), desc(shops.rating));

  return rows.map((r) => ({
    ...r,
    rating: Number(r.rating),
    minOrder: money(r.minOrderCents),
    fee: money(r.feeCents),
    freeOver: money(r.freeOverCents),
    eta: `${r.etaMin}–${r.etaMax} min`,
  }));
}

/** Brands carried by services delivering now, busiest first. */
export async function getBrands(limit = 24) {
  const rows = await db.select({
    name: brands.name, kind: brands.kind,
    products: sql`count(${products.id})`.mapWith(Number),
  })
    .from(brands)
    .leftJoin(products, eq(products.brandId, brands.id))
    .groupBy(brands.id)
    .orderBy(desc(sql`count(${products.id})`), asc(brands.name))
    .limit(limit);
  return rows;
}

/** The counted statement in the first viewport. */
export async function getStats() {
  const [row] = await db.select({
    deliveringNow: sql`count(distinct ${shops.id}) filter (where ${shops.deliveringNow})`.mapWith(Number),
    services: sql`count(distinct ${shops.id})`.mapWith(Number),
  }).from(shops);

  const [p] = await db.select({
    products: sql`count(*)`.mapWith(Number),
  }).from(products);

  const [b] = await db.select({ brands: sql`count(*)`.mapWith(Number) }).from(brands);

  const [fastest] = await db.select({ min: sql`min(${shops.etaMinMinutes})`.mapWith(Number) })
    .from(shops).where(eq(shops.deliveringNow, true));

  return { ...row, ...p, ...b, fastestEta: fastest?.min ?? null };
}

/* ─────────────────────────────────────────────────────────────
   Reads for the interior pages.
   ───────────────────────────────────────────────────────────── */

/** One category with its subcategories and live count. */
export async function getCategory(slug) {
  const [cat] = await db.select({
    id: categories.id, slug: categories.slug, name: categories.name,
    blurb: categories.blurb,
  }).from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!cat) return null;

  const subs = await db.select({
    id: subcategories.id, name: subcategories.name,
    count: sql`count(${products.id})`.mapWith(Number),
  })
    .from(subcategories)
    .leftJoin(products, eq(products.subcategoryId, subcategories.id))
    .where(eq(subcategories.categoryId, cat.id))
    .groupBy(subcategories.id)
    .orderBy(asc(subcategories.sortOrder));

  const [{ count }] = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(products).where(eq(products.categoryId, cat.id));

  return { ...cat, subs, count };
}

/* Every sort ends on products.id.

   None of these columns is unique — dozens of products share a price, a
   potency, an ETA. Without a deterministic final key, Postgres may order tied
   rows differently between two queries, and since paging is LIMIT/OFFSET over
   separate queries, that shows the same product on two pages while another
   never appears at all. The id breaks every tie the same way each time. */
const SORTS = {
  price_asc: [asc(products.priceCents), asc(products.id)],
  price_desc: [desc(products.priceCents), asc(products.id)],
  potency: [desc(products.thc), asc(products.id)],
  fastest: [asc(shops.etaMinMinutes), asc(products.id)],
  rated: [desc(shops.rating), asc(products.id)],
};

/* Listings are paged rather than capped.

   These two queries used to take a flat .limit(120) and .limit(200). That is
   not a page size, it is a silent truncation: with the catalogue at 553
   products, /products showed 200 and quietly dropped the other 353, and there
   was no route to them from anywhere on the site. A page size plus a total
   count means every product is reachable and the UI can say how many there are.

   The count runs against the same joins and predicates as the rows, so the
   total can never disagree with what the pages actually contain. */

export const PER_PAGE = 60;

/** Clamp a ?page= value to a whole number of at least 1. */
export function pageNumber(raw) {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

const paged = (total, page) => ({
  total,
  page,
  perPage: PER_PAGE,
  pages: Math.max(1, Math.ceil(total / PER_PAGE)),
});

/** Filtered, sorted products for a category page, one page at a time. */
export async function getCategoryProducts(slug, opts = {}) {
  const { sub, sort = "price_asc", liveOnly = true, brand, page = 1 } = opts;
  const where = [eq(categories.slug, slug)];
  if (sub) where.push(eq(subcategories.name, sub));
  if (brand) where.push(eq(brands.slug, brand));
  if (liveOnly) where.push(eq(shops.deliveringNow, true));

  const [rows, [{ total }]] = await Promise.all([
    withJoins(db.select(productSelect))
      .where(and(...where))
      .orderBy(...(SORTS[sort] ?? SORTS.price_asc))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    withJoins(db.select({ total: sql`count(*)`.mapWith(Number) })).where(and(...where)),
  ]);

  return { items: rows.map(shapeProduct), ...paged(total, page) };
}

/** Everything, for the /products index, one page at a time. */
export async function getAllProducts(opts = {}) {
  const { sort = "price_asc", liveOnly = true, page = 1 } = opts;
  const where = liveOnly ? [eq(shops.deliveringNow, true)] : [];
  const predicate = where.length ? and(...where) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    withJoins(db.select(productSelect))
      .where(predicate)
      .orderBy(...(SORTS[sort] ?? SORTS.price_asc))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    withJoins(db.select({ total: sql`count(*)`.mapWith(Number) })).where(predicate),
  ]);

  return { items: rows.map(shapeProduct), ...paged(total, page) };
}

/** One product, with everything a detail page shows. */
export async function getProduct(slug) {
  const [row] = await withJoins(db.select({
    ...productSelect,
    categoryName: categories.name,
    brandSlug: brands.slug,
    brandKind: brands.kind,
    shopArea: shops.serviceArea,
    shopRating: shops.rating,
    shopReviews: shops.reviewCount,
    shopWindow: shops.windowLabel,
    shopLicense: shops.license,
  })).where(eq(products.slug, slug)).limit(1);
  if (!row) return null;
  return {
    ...shapeProduct(row),
    categoryName: row.categoryName,
    brandSlug: row.brandSlug,
    brandKind: row.brandKind,
    shopArea: row.shopArea,
    shopRating: Number(row.shopRating),
    shopReviews: row.shopReviews,
    shopWindow: row.shopWindow,
    shopLicense: row.shopLicense,
  };
}

/** More like this: same category, different product. */
export async function getRelated(categorySlug, excludeSlug, limit = 6) {
  const rows = await withJoins(db.select(productSelect))
    .where(and(eq(categories.slug, categorySlug), sql`${products.slug} <> ${excludeSlug}`))
    .orderBy(desc(products.featured), asc(products.priceCents))
    .limit(limit);
  return rows.map(shapeProduct);
}

/** One delivery service. */
export async function getShop(slug) {
  const [row] = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
  if (!row) return null;
  const [{ menuCount }] = await db.select({ menuCount: sql`count(*)`.mapWith(Number) })
    .from(products).where(eq(products.shopId, row.id));
  return {
    id: row.id, slug: row.slug, name: row.name,
    area: row.serviceArea, license: row.license,
    rating: Number(row.rating), reviews: row.reviewCount,
    live: row.deliveringNow, window: row.windowLabel,
    etaMin: row.etaMinMinutes, etaMax: row.etaMaxMinutes,
    eta: `${row.etaMinMinutes}–${row.etaMaxMinutes} min`,
    minOrder: money(row.minOrderCents), fee: money(row.deliveryFeeCents),
    freeOver: money(row.freeDeliveryOverCents),
    menuCount, deal: row.deal,
  };
}

/** A service's menu, grouped by category. */
export async function getShopMenu(shopId) {
  const rows = await withJoins(db.select({ ...productSelect, categoryName: categories.name }))
    .where(eq(products.shopId, shopId))
    .orderBy(asc(categories.sortOrder), asc(products.priceCents));
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.category)) groups.set(r.category, { slug: r.category, name: r.categoryName, items: [] });
    groups.get(r.category).items.push(shapeProduct(r));
  }
  return [...groups.values()];
}

/** Every brand, with counts — for the /brands index. */
export async function getAllBrands() {
  return db.select({
    slug: brands.slug, name: brands.name, kind: brands.kind, featured: brands.featured,
    logoAvif: brands.logoAvif, logoWebp: brands.logoWebp,
    products: sql`count(${products.id})`.mapWith(Number),
  })
    .from(brands)
    .leftJoin(products, eq(products.brandId, brands.id))
    .groupBy(brands.id)
    .orderBy(asc(brands.name));
}

/** One brand and its catalogue. */
export async function getBrand(slug) {
  const [row] = await db.select().from(brands).where(eq(brands.slug, slug)).limit(1);
  if (!row) return null;
  const items = await withJoins(db.select(productSelect))
    .where(eq(brands.slug, slug))
    .orderBy(asc(categories.sortOrder), asc(products.priceCents));
  return { ...row, items: items.map(shapeProduct) };
}

/** Every live deal, deepest cut first. */
export async function getAllDeals() {
  const rows = await withJoins(db.select(productSelect))
    .where(and(isNotNull(products.wasPriceCents), eq(shops.deliveringNow, true)))
    .orderBy(desc(sql`(${products.wasPriceCents} - ${products.priceCents})::float / ${products.wasPriceCents}`));
  return rows.map(shapeProduct);
}

/**
 * Search products.
 *
 * Matches across name, brand, category, subcategory, strain, description,
 * effects and flavours — so "rove", "vape", "indica", "citrus" and "sleepy" all
 * find something. Every whitespace-separated term must match somewhere, which
 * stops "blue dream cart" returning everything blue.
 *
 * Results are ranked rather than arbitrary: an exact brand or product hit
 * outranks a prefix, which outranks a substring, which outranks a trigram
 * near-miss. That last tier catches typos and partial words — "stiizy" still
 * finds STIIIZY — and is why pg_trgm is installed.
 */
export async function searchProducts(q, limit = 60) {
  const query = String(q ?? "").trim();
  if (!query) return [];

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
  const whole = query.toLowerCase();

  const haystack = sql`lower(
    coalesce(${products.name}, '') || ' ' ||
    coalesce(${brands.name}, '') || ' ' ||
    coalesce(${categories.name}, '') || ' ' ||
    coalesce(${subcategories.name}, '') || ' ' ||
    coalesce(${products.strainType}, '') || ' ' ||
    coalesce(${products.description}, '') || ' ' ||
    coalesce(array_to_string(${products.effects}, ' '), '') || ' ' ||
    coalesce(array_to_string(${products.flavors}, ' '), '')
  )`;

  // Every term must land somewhere, or be a close trigram match on the two
  // fields people actually type: the product name and the brand.
  const clauses = terms.map(
    (t) => sql`(${haystack} like ${"%" + t + "%"}
      or similarity(lower(${products.name}), ${t}) > 0.34
      or similarity(lower(${brands.name}), ${t}) > 0.34)`
  );
  const where = clauses.reduce((acc, cur) => (acc ? sql`${acc} and ${cur}` : cur), null);

  const rank = sql`(
    case
      when lower(${brands.name}) = ${whole} then 100
      when lower(${products.name}) = ${whole} then 90
      when lower(${brands.name}) like ${whole + "%"} then 70
      when lower(${products.name}) like ${whole + "%"} then 60
      when lower(${products.name}) like ${"%" + whole + "%"} then 40
      else 0
    end
    + greatest(
        similarity(lower(${products.name}), ${whole}),
        similarity(lower(${brands.name}), ${whole})
      ) * 20
    + case when ${products.featured} then 3 else 0 end
  )`;

  const rows = await withJoins(db.select(productSelect))
    .where(where)
    .orderBy(desc(rank), asc(products.priceCents))
    .limit(limit);

  return rows.map(shapeProduct);
}

/** Brands matching a query, so searching a brand surfaces the brand itself. */
export async function searchBrands(q, limit = 8) {
  const query = String(q ?? "").trim();
  if (!query) return [];
  const t = query.toLowerCase();

  return db
    .select({
      slug: brands.slug, name: brands.name, kind: brands.kind,
      logoAvif: brands.logoAvif, logoWebp: brands.logoWebp,
      products: sql`count(${products.id})`.mapWith(Number),
    })
    .from(brands)
    .leftJoin(products, eq(products.brandId, brands.id))
    .where(sql`lower(${brands.name}) like ${"%" + t + "%"} or similarity(lower(${brands.name}), ${t}) > 0.3`)
    .groupBy(brands.id)
    .orderBy(desc(sql`similarity(lower(${brands.name}), ${t})`), desc(sql`count(${products.id})`))
    .limit(limit);
}

/** Slugs for static generation. */
export async function getAllSlugs() {
  const [p, c, b, s] = await Promise.all([
    db.select({ slug: products.slug }).from(products),
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: brands.slug }).from(brands),
    db.select({ slug: shops.slug }).from(shops),
  ]);
  return { products: p, categories: c, brands: b, shops: s };
}

/* ── Reviews ──────────────────────────────────────────────────

   Only `published` rows are ever counted or shown. A pending review does not
   move an average, because if it did, posting would change the score before
   anyone had looked at it. */

const PUBLISHED = eq(schema.reviews.status, "published");

/** Star distribution, average and counts for one target.
 *
 *  `ratings` counts every published row; `written` counts the subset with a
 *  body. Reporting one as the other is the small lie most listings tell —
 *  "412 reviews" where 380 of them are a star and nothing else. */
async function reviewSummaryFor(where) {
  const rows = await db
    .select({ rating: schema.reviews.rating, hasBody: sql`(${schema.reviews.body} is not null and ${schema.reviews.body} <> '')`.mapWith(Boolean) })
    .from(schema.reviews)
    .where(and(PUBLISHED, where));

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0, written = 0;
  for (const r of rows) {
    dist[r.rating] = (dist[r.rating] ?? 0) + 1;
    sum += r.rating;
    if (r.hasBody) written++;
  }
  const ratings = rows.length;
  return {
    ratings,
    written,
    average: ratings ? Math.round((sum / ratings) * 10) / 10 : null,
    distribution: dist,
  };
}

const shapeReview = (r) => ({
  id: r.id,
  rating: r.rating,
  title: r.title,
  body: r.body,
  author: r.authorHandle,
  location: r.authorLocation,
  createdAt: r.createdAt,
  seeded: r.seeded,
});

/** Published reviews for a product, newest first. `star` filters to one rating. */
export async function getProductReviews(productId, { star, limit = 20 } = {}) {
  const where = [eq(schema.reviews.productId, productId)];
  if (star) where.push(eq(schema.reviews.rating, star));

  const [rows, summary] = await Promise.all([
    db.select().from(schema.reviews)
      .where(and(PUBLISHED, ...where))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(limit),
    reviewSummaryFor(eq(schema.reviews.productId, productId)),
  ]);
  return { items: rows.map(shapeReview), ...summary };
}

/** Published reviews for a delivery service. */
export async function getShopReviews(shopId, { star, limit = 20 } = {}) {
  const where = [eq(schema.reviews.shopId, shopId)];
  if (star) where.push(eq(schema.reviews.rating, star));

  const [rows, summary] = await Promise.all([
    db.select().from(schema.reviews)
      .where(and(PUBLISHED, ...where))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(limit),
    reviewSummaryFor(eq(schema.reviews.shopId, shopId)),
  ]);
  return { items: rows.map(shapeReview), ...summary };
}

/** Averages for a batch of products, for grids. Keyed by product id. */
export async function getProductRatings(productIds) {
  if (!productIds?.length) return {};
  const rows = await db
    .select({
      productId: schema.reviews.productId,
      n: sql`count(*)`.mapWith(Number),
      avg: sql`avg(${schema.reviews.rating})`.mapWith(Number),
    })
    .from(schema.reviews)
    .where(and(PUBLISHED, inArray(schema.reviews.productId, productIds)))
    .groupBy(schema.reviews.productId);

  const out = {};
  for (const r of rows) out[r.productId] = { count: r.n, average: Math.round(r.avg * 10) / 10 };
  return out;
}

/** Rating summary counting ONLY reviews a person actually wrote.
 *
 *  Seeded rows are excluded deliberately. They exist so the review surfaces
 *  can be seen working; they are not evidence of anything, and an average
 *  built from them has no business in structured data where a search engine
 *  will read it as a claim. This is what productSchema() uses, so the markup
 *  starts shipping on its own the moment real reviews arrive — and never
 *  before. */
export async function getGenuineRating({ productId, shopId }) {
  const target = productId
    ? eq(schema.reviews.productId, productId)
    : eq(schema.reviews.shopId, shopId);

  const [row] = await db
    .select({
      n: sql`count(*)`.mapWith(Number),
      avg: sql`coalesce(avg(${schema.reviews.rating}), 0)`.mapWith(Number),
    })
    .from(schema.reviews)
    .where(and(PUBLISHED, eq(schema.reviews.seeded, false), target));

  if (!row || row.n === 0) return null;
  return { count: row.n, average: Math.round(row.avg * 10) / 10 };
}
