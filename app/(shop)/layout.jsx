import site from "@/data/site.json";
import { getShops } from "@/db/queries";
import { DeliveryProvider } from "@/components/DeliveryContext";
import { CartProvider } from "@/components/CartContext";
import CartDrawer from "@/components/CartDrawer";
import AgeGate from "@/components/AgeGate";
import Header from "@/components/Header";
import LocationBar from "@/components/LocationBar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

export default async function ShopLayout({ children }) {
  const shops = await getShops();

  return (
    <DeliveryProvider defaultLocation={site.location.label}>
      <CartProvider>
        <AgeGate />
        <CartDrawer />

        <a
          href="#main"
          className="u-pill sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:flex focus:h-11 focus:items-center focus:bg-ink focus:px-5 focus:text-linen"
        >
          Skip to content
        </a>

        <div id="top" className="relative z-10 flex min-h-dvh flex-col">
          <Header site={site} />
          <LocationBar shops={shops} />
          <main id="main" className="flex-1">{children}</main>
          <Footer site={site} />
          {/* After the footer: a launcher pinned to the viewport, not part of the
              document flow, so it never pushes page content around. */}
          <ChatWidget />
        </div>
      </CartProvider>
    </DeliveryProvider>
  );
}
