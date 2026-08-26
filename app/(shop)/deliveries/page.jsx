import { getShops } from "@/db/queries";
import { canonical } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import ShopList from "@/components/ShopList";

export const revalidate = 60;

export const metadata = {
  alternates: canonical("/deliveries"),
  title: "Cannabis delivery services near you — Weedmaps",
  description: "Every licensed delivery service that reaches your address, with live arrival windows, fees and minimums.",
};

export default async function DeliveriesPage() {
  const shops = await getShops();
  const live = shops.filter((s) => s.live).length;

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Delivery" }]}
        title="Who is driving right now"
        blurb="Every licensed service that reaches your address. Arrival window, delivery fee and order minimum are on every row before you commit — there is no pickup option to weigh them against."
        meta={`${live} of ${shops.length} delivering now`}
      />
      <ShopList shops={shops} />
    </>
  );
}
