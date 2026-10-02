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
import BundleRecommendations from "@/components/BundleRecommendations";
import learn from "@/data/learn.json";
import testimonials from "@/data/testimonials.json";

import { canonical } from "@/lib/seo";

export const revalidate = 60;
export const metadata = { alternates: canonical("/") };

export default async function HomePage() {
  // Load metadata queries first
  const [cats, deals, shops, brands, stats, spotlight] = await Promise.all([
    getCategoryIndex(), getDeals(3), getShops(), getBrands(12), getStats(), getSpotlight(4),
  ]);

  // Load product queries sequentially (not in parallel) to avoid connection pool exhaustion
  const flower = await getShelf("flower", 3);
  const vape = await getShelf("vape", 3);
  const edibles = await getShelf("edibles", 3);
  const newArrivals = await getNewArrivals(3);
  const mostReviewed = await getMostReviewed(3);

  const safeShops = shops ?? [];
  const safeStats = stats ?? { deliveringNow: 0, services: 0, products: 0, brands: 0 };

  const shelf = (category, title, note, items) => ({ category, title, note, items });

  return (
    <>
      <Masthead stats={safeStats} shops={safeShops} />
      <Spotlight slides={spotlight} />
      <CategoryIndex categories={cats} />
      <Shelf shelf={shelf("flower", "Flower", "Eighths, quarters and ounces, delivered", flower)} flush />
      <Shelf shelf={shelf("vape", "Vape pens", "Live resin carts, pods and all-in-ones", vape)} />
      <BundleRecommendations products={[]} />
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
