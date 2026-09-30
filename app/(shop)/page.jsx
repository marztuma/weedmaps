import {
  getShelf, getCategoryIndex, getDeals, getShops, getBrands, getStats, getSpotlight,
  getNewArrivals, getMostReviewed,
} from "@/db/queries";

import Masthead from "@/components/Masthead";
import Spotlight from "@/components/Spotlight";
import Shelf from "@/components/Shelf";
import CategoryIndex from "@/components/CategoryIndex";
import DealsBand from "@/components/DealsBand";
import ShopList from "@/components/ShopList";
import BrandRibbon from "@/components/BrandRibbon";
import Learn from "@/components/Learn";
import AppCta from "@/components/AppCta";
import Testimonials from "@/components/Testimonials";
import learn from "@/data/learn.json";
import testimonials from "@/data/testimonials.json";

import { canonical } from "@/lib/seo";

export const revalidate = 60;
export const metadata = { alternates: canonical("/") };

export default async function HomePage() {
  const [flower, vape, edibles, cats, deals, shops, brands, stats, spotlight, newArrivals, mostReviewed] = await Promise.all([
    getShelf("flower", 12), getShelf("vape", 12), getShelf("edibles", 12),
    getCategoryIndex(), getDeals(6), getShops(), getBrands(20), getStats(),
    getSpotlight(8), getNewArrivals(12), getMostReviewed(12),
  ]);

  const safeShops = shops ?? [];

  const shelf = (category, title, note, items) => ({ category, title, note, items });

  return (
    <>
      <Masthead stats={stats} shops={safeShops} />
      <Spotlight slides={spotlight} />
      <CategoryIndex categories={cats} />
      <Shelf shelf={shelf("flower", "Flower", "Eighths, quarters and ounces, delivered", flower)} flush />
      <Shelf shelf={shelf("vape", "Vape pens", "Live resin carts, pods and all-in-ones", vape)} />
      <DealsBand deals={deals} endsIn="Ends 11:59 PM tonight" />
      <Shelf shelf={shelf("new-arrivals", "🆕 New Arrivals", "Just added to your local menu", newArrivals)} />
      <ShopList shops={safeShops} />
      <Shelf shelf={shelf("edibles", "Edibles", "Gummies, chocolate and mints, 2mg and up", edibles)} tone="deep" />
      <Shelf shelf={shelf("most-reviewed", "Customer Favorites", "Highest-rated products from real customers", mostReviewed)} />
      <Testimonials testimonials={testimonials.testimonials} />
      <BrandRibbon brands={brands} />
      <Learn learn={learn} />
      <AppCta />
    </>
  );
}
