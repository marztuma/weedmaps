import Icon from "./Icons";
import { resolveProductImage } from "@/lib/images";

/* The product face.

   Two renditions of one object. When the client's photography exists, the photo
   is the face — sat on the colourway ground with the same die-cut rule, and
   keeping the stamped strain seal so it still reads as part of this system
   rather than a stock image dropped into a hole. When there is no photograph
   (wellness and genetics have none), the authored package label renders
   instead, exactly as before. A product is never a blank frame.

   Colourways are drawn from the committed palette. Every pair below was
   measured against its own ground, foreground and dim alike, at 4.5:1 or better:
     ink    fg 16.0  dim 6.8      orange fg 5.4  dim 5.4
     purple fg 5.8   dim 4.9      green  fg 5.2  dim 4.6
     linen  fg 15.4  dim 5.1 */

const COLORWAYS = {
  ink: { bg: "#141314", fg: "#f9f5f2", dim: "#a09da6", seal: "#f15a26", sealInk: "#141314" },
  orange: { bg: "#f15a26", fg: "#141314", dim: "#2a0d05", seal: "#141314", sealInk: "#f15a26" },
  purple: { bg: "#7755a3", fg: "#f9f5f2", dim: "#efe8f5", seal: "#f9c5b3", sealInk: "#3c1f52" },
  green: { bg: "#419b45", fg: "#141314", dim: "#14251a", seal: "#141314", sealInk: "#419b45" },
  linen: { bg: "#f2ece7", fg: "#141314", dim: "#5f5c66", seal: "#b8431a", sealInk: "#f9f5f2" },
};

const TYPE_MARK = { Indica: "I", Sativa: "S", Hybrid: "H" };

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)'/%3E%3C/svg%3E\")";

function Seal({ c, product, size }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full ${size === "hero" ? "h-14 w-14" : "h-11 w-11"}`}
      style={{ backgroundColor: c.seal, color: c.sealInk }}
      title={`${product.type} · ${product.thc}% THC`}
    >
      <span className={`u-data font-semibold leading-none ${size === "hero" ? "text-[17px]" : "text-[13px]"}`}>
        {TYPE_MARK[product.type] || "H"}
      </span>
    </div>
  );
}

export default function ProductLabel({ product, category = "flower", size = "card" }) {
  const c = COLORWAYS[product.colorway] || COLORWAYS.linen;
  // Cloudinary when uploaded and configured, the local file otherwise. Neither
  // this component nor its callers need to know which.
  const photo = resolveProductImage(product, size === "hero" ? "hero" : "grid");

  if (photo) {
    return (
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-sm"
        style={{ backgroundColor: c.bg }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.13] mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
        />

        {/* Explicit dimensions on a fixed 4:5 frame, so nothing reflows as
            images arrive. Cloudinary negotiates format and DPR itself, which is
            why the CDN path needs no <source> elements. */}
        {photo.source === "cloudinary" ? (
          <img
            src={photo.src}
            srcSet={photo.srcSet ?? undefined}
            sizes={size === "hero" ? "(max-width: 640px) 90vw, 420px" : "(max-width: 640px) 45vw, 220px"}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <picture>
            {photo.avif && <source srcSet={photo.avif} type="image/avif" />}
            {photo.webp && <source srcSet={photo.webp} type="image/webp" />}
            <img
              src={photo.webp || photo.avif}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        )}

        {/* die-cut rule, same as the authored label */}
        <div
          className="pointer-events-none absolute inset-[7px] z-[2] rounded-[2px] border"
          style={{ borderColor: c.fg, opacity: 0.28 }}
        />

        {/* the seal survives from the label system, so the family still reads */}
        <div className="absolute bottom-[7%] right-[7%] z-[3]">
          <Seal c={c} product={product} size={size} />
        </div>

        {product.thc > 0 && (
          <div
            className="u-meta absolute bottom-[7%] left-[7%] z-[3] rounded-pill px-2.5 py-1"
            style={{ backgroundColor: c.bg, color: c.fg }}
          >
            THC {product.thc}%
          </div>
        )}
      </div>
    );
  }

  // No photograph — the authored package label, unchanged.
  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-sm"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />

      <div
        className="pointer-events-none absolute inset-[7px] rounded-[2px] border"
        style={{ borderColor: c.fg, opacity: 0.28 }}
      />

      <div className="relative flex h-full flex-col justify-between p-[9%]">
        <div className="flex items-start justify-between gap-2">
          <span className="u-meta block max-w-[72%] leading-tight" style={{ opacity: 0.85 }}>
            {product.brand}
          </span>
          <Icon name={category} size={17} style={{ opacity: 0.6 }} />
        </div>

        <div className="-mt-[6%]">
          <h4
            className={`u-display ${
              size === "hero"
                ? "text-[clamp(1.6rem,3.4vw,2.75rem)]"
                : "text-[clamp(1.15rem,1.4vw+0.85rem,1.6rem)]"
            }`}
            style={{ hyphens: "auto" }}
          >
            {product.name}
          </h4>
        </div>

        <div>
          <div className="mb-[7%] flex items-end gap-[3px]" aria-hidden="true" style={{ opacity: 0.45 }}>
            {[7, 4, 9, 3, 6, 11, 4, 8, 3, 5, 10, 4, 7, 3, 9, 5].map((h, i) => (
              <span key={i} style={{ height: h, width: 1.5, backgroundColor: c.fg }} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="u-meta leading-relaxed" style={{ color: c.dim }}>
              <span style={{ color: c.fg }}>{product.type}</span>
              <br />
              {product.weight}
            </div>
            <Seal c={c} product={product} size={size} />
          </div>

          <div
            className="u-data mt-[6%] flex items-baseline justify-between border-t pt-[5%] text-[11px]"
            style={{ borderColor: c.fg, borderTopWidth: 1 }}
          >
            <span>THC {product.thc}%</span>
            <span style={{ color: c.dim }}>CBD {product.cbd}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
