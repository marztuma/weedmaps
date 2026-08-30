import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, organizationSchema, websiteSchema } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  /* Search Console ownership. Set GOOGLE_SITE_VERIFICATION to the token from
     the HTML tag method and Next renders the meta tag on every page. Absent,
     the key is simply omitted rather than rendered empty. */
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  title: "Weedmaps — Shop the shelf, we drive",
  description:
    "Compare cannabis products across every licensed delivery service that reaches you. Live menus, real prices, delivered.",
  icons: { icon: "/favicon.svg" },
};

export const viewport = { themeColor: "#f9f5f2" };

const DIRECTION_CONTRACT = `<!--
  DIRECTION CONTRACT — surface: homepage — seed key 4259fa8c

  THESIS: You shop the product, not the shop. This page refuses the category
  default: a search box over a grid of dispensary tiles that hides every price
  behind a click.

  OWN-WORLD: Linen #f9f5f2 under paper tooth, ink #141314, orange #f15a26 as a
  drenched band, purple #7755a3, green #419b45. Manrope 200/800 at -0.04em; mono
  strictly for measurement. Hairline rules, 4-10px radii, 50px pill controls.
  Products render as authored package labels, never stock photography.

  STORY: This marketplace is delivery-only — there is no pickup. The visitor sets
  a delivery address, sees real products at real prices with the arrival window
  that reaches them, and leaves knowing which service to order from tonight.

  FIRST VIEWPORT: A sticky address bar carrying the Delivering-now filter and the
  Fastest/Top-rated sort, the counted statement of who is driving beneath it, and
  the first flower shelf already bleeding off the right edge with its prices above
  the fold. The primary action is the delivery address; it stays reachable on scroll.

  FORM: The Shelf — index 2 of 7, dealt by the roll and locked by the user.

  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${geistMono.variable}`}>
      {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
        <head>
          {/* Saves the DNS + TLS handshake on the first product image. */}
          <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        </head>
      )}
      <body className="relative">
        <div hidden dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
