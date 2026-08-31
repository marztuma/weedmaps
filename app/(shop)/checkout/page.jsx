import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import PageHeader from "@/components/PageHeader";
import CheckoutForm from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Checkout — Weedmaps",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const methods = await db
    .select()
    .from(schema.paymentMethods)
    .where(eq(schema.paymentMethods.active, true))
    .orderBy(asc(schema.paymentMethods.sortOrder));

  return (
    <>
      <PageHeader
        trail={[{ label: "Home", href: "/" }, { label: "Checkout" }]}
        title="Checkout"
        blurb="Order from any service you like — we sort out who delivers what, and route each item to whoever can get it to you fastest. We deliver to all fifty states. Payment is arranged after you place the order; nothing is charged automatically."
      />
      <CheckoutForm methods={methods} />
    </>
  );
}
