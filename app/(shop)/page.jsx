import {
  getShelf, getCategoryIndex, getDeals, getShops, getBrands, getStats,
} from "@/db/queries";

import Masthead from "@/components/Masthead";
import Shelf from "@/components/Shelf";
import CategoryIndex from "@/components/CategoryIndex";
import DealsBand from "@/components/DealsBand";
import ShopList from "@/components/ShopList";
import BrandRibbon from "@/components/BrandRibbon";
import Learn from "@/components/Learn";
import AppCta from "@/components/AppCta";
import learn from "@/data/learn.json";

import { canonical } from "@/lib/seo";

export const revalidate = 60;
export const metadata = { alternates: canonical("/") };

export default async function HomePage() {
  const [flower, vape, edibles, cats, deals, shops, brands, stats] = await Promise.all([
    getShelf("flower", 12), getShelf("vape", 12), getShelf("edibles", 12),
    getCategoryIndex(), getDeals(6), getShops(), getBrands(20), getStats(),
  ]);

  const shelf = (category, title, note, items) => ({ category, title, note, items });

  return (
    <>
      <Masthead stats={stats} shops={shops} />
      <Shelf shelf={shelf("flower", "Flower", "Eighths, quarters and ounces, delivered", flower)} flush />
      <CategoryIndex categories={cats} />
      <Shelf shelf={shelf("vape", "Vape pens", "Live resin carts, pods and all-in-ones", vape)} />
      <DealsBand deals={deals} endsIn="Ends 11:59 PM tonight" />
      <ShopList shops={shops} />
      <Shelf shelf={shelf("edibles", "Edibles", "Gummies, chocolate and mints, 2mg and up", edibles)} tone="deep" />
      <BrandRibbon brands={brands} />
      <Learn learn={learn} />
      <AppCta />
    </>
  );
}
