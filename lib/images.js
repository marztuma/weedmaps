/* One place that decides where a product image comes from.

   Cloudinary when the product has been uploaded and a cloud name is configured;
   the local file in /public otherwise. Nothing else in the app knows which is in
   play, so switching storage is a configuration change rather than a refactor —
   and a half-finished migration renders correctly, because each product falls
   back on its own.

   Transformations are built at render time from the public id, so changing
   sizes or quality never needs a data migration. */

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Widths the UI actually asks for: card, grid, hero. */
export const IMAGE_SIZES = { card: 420, grid: 560, hero: 900 };

export function cloudinaryUrl(publicId, { width = 560, quality = "auto", format = "auto" } = {}) {
  if (!CLOUD || !publicId) return null;
  const t = [`f_${format}`, `q_${quality}`, `w_${width}`, "c_limit", "dpr_auto"].join(",");
  return `https://res.cloudinary.com/${CLOUD}/image/upload/${t}/${publicId}`;
}

/**
 * Resolve a product's image into what a <picture> needs.
 * Returns null when the product has no photograph at all — callers render the
 * authored package label instead.
 */
export function resolveProductImage(product, size = "grid") {
  const width = IMAGE_SIZES[size] ?? IMAGE_SIZES.grid;
  const alt = product?.image?.alt || product?.imageAlt ||
    [product?.brand, product?.name].filter(Boolean).join(" ");

  const cloudId = product?.imageCloudId ?? product?.image?.cloudId;
  if (cloudId && CLOUD) {
    return {
      src: cloudinaryUrl(cloudId, { width }),
      srcSet: [1, 2]
        .map((d) => `${cloudinaryUrl(cloudId, { width: width * d })} ${d}x`)
        .join(", "),
      avif: null,
      webp: null,
      alt,
      source: "cloudinary",
    };
  }

  const avif = product?.image?.avif ?? product?.imageAvif;
  const webp = product?.image?.webp ?? product?.imageWebp;
  if (!avif && !webp) return null;

  return { src: webp || avif, srcSet: null, avif, webp, alt, source: "local" };
}

export const cloudinaryConfigured = () => Boolean(CLOUD);
