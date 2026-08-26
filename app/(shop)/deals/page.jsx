import { getAllDeals } from "@/db/queries";
import PageHeader from "@/components/PageHeader";
import ProductGrid from "@/components/ProductGrid";
import Icon from "@/components/Icons";

export const revalidate = 60;

export const metadata = {
  title: "Cannabis deals delivering tonight — Weedmaps",
  description: "Every discounted product from a service delivering to you right now, deepest cut first.",
};

export default async function DealsPage() {
  const deals = await getAllDeals();
  const deepest = deals.length
    ? Math.max(...deals.map((d) => Math.round(((d.was - d.price) / d.was) * 100)))
    : 0;
  const saved = deals.reduce((n, d) => n + (d.was - d.price), 0);

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Deals" }]}
        title="Cheaper today than yesterday."
        blurb="Every discount from a service that can actually reach you tonight. A deal you cannot receive is not a deal, so paused services are left out."
        meta={
          <span className="flex items-center gap-2">
            <Icon name="clock" size={14} />
            Ends 11:59 PM tonight
          </span>
        }
      />

      <section className="bg-orange text-ink">
        <div className="u-shell flex flex-wrap items-center gap-x-10 gap-y-3 py-5">
          <p className="u-meta flex items-center gap-2 text-ember">
            <span className="u-data text-[1.5rem] font-semibold text-ink">{deals.length}</span>
            products discounted
          </p>
          <p className="u-meta flex items-center gap-2 text-ember">
            <span className="u-data text-[1.5rem] font-semibold text-ink">{deepest}%</span>
            deepest cut
          </p>
          <p className="u-meta flex items-center gap-2 text-ember">
            <span className="u-data text-[1.5rem] font-semibold text-ink">${saved}</span>
            off across the board
          </p>
        </div>
      </section>

      <section className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
        <ProductGrid
          products={deals}
          emptyTitle="No deals running tonight."
          emptyBody="Nothing is discounted from a service currently delivering to you. Check back tomorrow."
        />
      </section>
    </>
  );
}
