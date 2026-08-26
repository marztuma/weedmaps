/* Structured data and canonical URLs.

   One rule governs everything here: markup describes what the page actually
   says. Where the catalogue carries demonstration figures rather than real
   ones, the corresponding property is omitted rather than published — invented
   ratings and review counts in schema are precisely what search engines
   penalise, and a penalty is harder to undo than a missing property.

   Product prices ARE the prices this site quotes, so Offer ships. Product
   review scores do not exist at all, so AggregateRating never ships for a
   product. Delivery-service ratings are demonstration data, so they ship only
   when SEO_PUBLISH_RATINGS is explicitly turned on. */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100")
  .replace(/\/$/, "");

export const SITE_NAME = "Weedmaps";

/** Ratings in this build are demonstration data. Off unless deliberately enabled. */
export const publishRatings = () => process.env.SEO_PUBLISH_RATINGS === "true";

export const absolute = (p = "/") => `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`;

/** Canonical for a route, with query strings deliberately dropped: ?sort= and
 *  ?sub= produce the same goods in a different order, not a different page. */
export const canonical = (path) => ({ canonical: absolute(path) });

/** Canonical for one page of a paginated listing.
 *
 *  Page 2 canonicalises to page 2, never back to page 1. Pointing every page at
 *  the first is the classic pagination mistake: it tells the crawler pages 2..n
 *  are duplicates of page 1, and the products that only appear deeper in the
 *  list stop being discoverable through the listing at all. Page 1 stays the
 *  bare path so it does not answer to two addresses. */
export const canonicalPage = (path, page) => ({
  canonical: absolute(page > 1 ? `${path}?page=${page}` : path),
});

const clean = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "" ) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
};

export function organizationSchema() {
  return clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "A delivery-only marketplace connecting adults with licensed cannabis delivery services and brands.",
  });
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(trail) {
  const items = trail.filter((t) => t.label);
  if (items.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((t, i) => clean({
      "@type": "ListItem",
      position: i + 1,
      name: t.label,
      item: t.href ? absolute(t.href) : undefined,
    })),
  };
}

export function productSchema(p, { imageUrl } = {}) {
  const available = p.shopLive !== false;

  return clean({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description || undefined,
    image: imageUrl ? [imageUrl] : undefined,
    sku: p.slug,
    category: p.categoryName || p.category,
    brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
    // Potency is a measured property of the goods, so it belongs here.
    additionalProperty: [
      p.thc > 0 && { "@type": "PropertyValue", name: "THC", value: `${p.thc}%` },
      p.cbd > 0 && { "@type": "PropertyValue", name: "CBD", value: `${p.cbd}%` },
      p.weight && { "@type": "PropertyValue", name: "Size", value: p.weight },
      p.type && { "@type": "PropertyValue", name: "Strain type", value: p.type },
    ].filter(Boolean),
    offers: clean({
      "@type": "Offer",
      url: absolute(`/product/${p.slug}`),
      priceCurrency: "USD",
      price: typeof p.price === "number" ? p.price.toFixed(2) : undefined,
      availability: available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: p.shop ? { "@type": "Organization", name: p.shop } : undefined,
      // deliveryLeadTime is real: it is the service's own quoted window
      eligibleTransactionVolume: undefined,
    }),
    // No product review data exists in this build, so AggregateRating is
    // deliberately absent. Publishing an invented score is a penalty risk.
  });
}

export function deliveryServiceSchema(shop, { menuUrl } = {}) {
  return clean({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absolute(`/delivery/${shop.slug}#business`),
    name: shop.name,
    url: absolute(`/delivery/${shop.slug}`),
    description: `Licensed cannabis delivery serving ${shop.area}. Arrives in ${shop.eta}.`,
    areaServed: shop.area ? { "@type": "Place", name: shop.area } : undefined,
    priceRange: "$$",
    hasMap: undefined,
    makesOffer: menuUrl ? { "@type": "Offer", url: menuUrl } : undefined,
    // Demonstration figures unless explicitly published.
    aggregateRating:
      publishRatings() && shop.rating && shop.reviews
        ? {
            "@type": "AggregateRating",
            ratingValue: String(shop.rating),
            reviewCount: String(shop.reviews),
            bestRating: "5",
          }
        : undefined,
  });
}

export function itemListSchema(products, { name, path }) {
  if (!products?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absolute(path),
    numberOfItems: products.length,
    itemListElement: products.slice(0, 40).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absolute(`/product/${p.slug}`),
      name: p.name,
    })),
  };
}

export function faqSchema(pairs) {
  if (!pairs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
