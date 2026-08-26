import { ImageResponse } from "next/og";
import { getProduct } from "@/db/queries";

/* Social card for a product.

   Drawn in the storefront's own world — linen ground, ink type, the orange
   accent — so a shared link looks like the site rather than a generic preview.

   Two constraints shape the code. The OG runtime ships its own layout engine
   that supports a subset of CSS: flexbox only, no custom properties, no
   stylesheet. And this is a route handler rather than the opengraph-image
   convention, for the loader reason documented in app/sitemap.xml/route.js.
   Both mean the tokens are written literally here — the one place in this
   codebase where that is correct rather than drift. */

const LINEN = "#f9f5f2";
const INK = "#141314";
const ORANGE = "#f15a26";
const SHADE = "#5f5c66";
const RULE = "#d6d5d9";

const SIZE = { width: 1200, height: 630 };

export const revalidate = 86400;

function Card({ children }) {
  return (
    <div
      style={{
        width: "100%", height: "100%", display: "flex", flexDirection: "column",
        justifyContent: "space-between", background: LINEN, color: INK,
        padding: 72, fontFamily: "sans-serif",
      }}
    >
      {children}
    </div>
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* The mark is drawn, not typed: the OG runtime ships one fallback font
          and a glyph like U+25C9 lands as tofu. Geometry always renders. */}
      <div style={{
        width: 34, height: 34, borderRadius: 999, background: INK,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 13, height: 13, borderRadius: 999, background: LINEN, display: "flex" }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>Weedmaps</div>
    </div>
  );
}

export async function GET(request, { params }) {
  const { slug } = await params;

  let p = null;
  try {
    p = await getProduct(slug);
  } catch {
    // A preview card is never worth failing a request over.
  }

  if (!p) {
    return new ImageResponse(
      (
        <Card>
          <Wordmark />
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
            Cannabis, delivered.
          </div>
          <div style={{ display: "flex", fontSize: 26, color: SHADE }}>
            Licensed delivery services near you
          </div>
        </Card>
      ),
      SIZE
    );
  }

  const price = typeof p.price === "number" ? `$${p.price.toFixed(2)}` : "";
  const facts = [
    p.weight,
    p.thc > 0 ? `${p.thc}% THC` : null,
    p.type,
  ].filter(Boolean);

  return new ImageResponse(
    (
      <Card>
        <Wordmark />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {p.brand && (
            <div style={{ display: "flex", fontSize: 24, color: SHADE, letterSpacing: 2 }}>
              {p.brand.toUpperCase()}
            </div>
          )}
          <div style={{
            display: "flex", fontSize: p.name.length > 34 ? 64 : 86, fontWeight: 800,
            letterSpacing: -3, lineHeight: 1.05, marginTop: 14, maxWidth: 1000,
          }}>
            {p.name}
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          borderTop: `1px solid ${RULE}`, paddingTop: 26,
        }}>
          <div style={{ display: "flex", gap: 40, fontSize: 26, color: SHADE }}>
            {price && (
              <div style={{ display: "flex", color: INK, fontWeight: 700 }}>{price}</div>
            )}
            {facts.map((f) => (
              <div key={f} style={{ display: "flex" }}>{f}</div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: ORANGE, fontWeight: 700 }}>
            Delivered
          </div>
        </div>
      </Card>
    ),
    SIZE
  );
}
