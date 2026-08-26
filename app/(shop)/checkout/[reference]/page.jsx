import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/db/client";
import { Breadcrumb } from "@/components/PageHeader";
import CopyField from "@/components/CopyField";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import Icon from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order placed — Weedmaps", robots: { index: false, follow: false } };

const { orders, orderItems, shops, customers, paymentMethods } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

export default async function ConfirmationPage({ params, searchParams }) {
  const { reference } = await params;
  const sp = await searchParams;
  const alsoRefs = typeof sp.also === "string" ? sp.also.split(",").filter(Boolean) : [];

  const refs = [reference, ...alsoRefs];
  const rows = await db.select({
    id: orders.id, reference: orders.reference,
    subtotal: orders.subtotalCents, fee: orders.deliveryFeeCents, total: orders.totalCents,
    paymentMethod: orders.paymentMethod, paymentStatus: orders.paymentStatus,
    destination: orders.paymentDestination,
    email: orders.contactEmail, address: orders.deliveryAddress,
    shop: shops.name, eta: shops.etaMinMinutes, etaMax: shops.etaMaxMinutes,
    customer: customers.name,
  })
    .from(orders)
    .leftJoin(shops, eq(orders.shopId, shops.id))
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(inArray(orders.reference, refs));

  if (!rows.length) notFound();
  const primary = rows.find((r) => r.reference === reference) ?? rows[0];

  const [method] = await db.select().from(paymentMethods)
    .where(eq(paymentMethods.code, primary.paymentMethod)).limit(1);

  const items = await db.select().from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));

  const grandTotal = rows.reduce((n, r) => n + r.total, 0);

  // QR is generated here, server-side — no external image service is contacted.
  let qr = null;
  if (method?.destination) {
    const payload = method.code === "btc" ? `bitcoin:${method.destination}` : method.destination;
    qr = await QRCode.toDataURL(payload, {
      margin: 1, width: 320, color: { dark: "#141314", light: "#f9f5f2" },
    });
  }

  return (
    <>
      <ClearCartOnMount />

      <div className="u-shell pt-[clamp(1.5rem,3vw,2.5rem)]">
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Order placed" }]} />
      </div>

      <section className="u-shell pb-[clamp(3rem,6vw,5rem)]">
        <div className="flex items-start gap-4">
          <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ backgroundColor: "var(--color-green-tint)", color: "var(--color-green-deep)" }}>
            <Icon name="check" size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="u-display text-[clamp(1.9rem,4.6vw,3.25rem)]">
              Order placed. Now pay to confirm it.
            </h1>
            <p className="u-prose mt-3 text-[1rem] leading-relaxed text-shade">
              Nothing has been charged. Your order is held as{" "}
              <strong className="font-semibold text-ink">awaiting payment</strong> until we
              confirm the funds arrived — then we email {primary.email} and dispatch.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="min-w-0">
            <div className="rounded-md border border-ink p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="u-heading text-[1.35rem]">{method?.label ?? "Payment"}</h2>
                {method?.network && <span className="u-meta text-shade">{method.network}</span>}
              </div>

              {method?.instructions && (
                <p className="u-prose mt-3 text-[0.95rem] leading-relaxed text-shade">{method.instructions}</p>
              )}

              {method?.destination ? (
                <>
                  <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
                    {qr && (
                      <img
                        src={qr}
                        alt={`QR code for the ${method.label} address`}
                        width={160}
                        height={160}
                        className="shrink-0 rounded-sm border border-rule"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <CopyField label={`${method.label} address`} value={method.destination} />
                      <div className="mt-4 grid gap-1">
                        <p className="u-meta flex justify-between text-shade">
                          <span>Amount to send</span>
                          <span className="u-data text-ink">{money(grandTotal)} equivalent</span>
                        </p>
                        <p className="u-meta flex justify-between text-shade">
                          <span>Confirmations needed</span>
                          <span className="u-data text-ink">{method.confirmations}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <p
                    className="u-meta mt-6 flex items-start gap-2 rounded-xs px-3 py-2.5 leading-relaxed"
                    style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}
                  >
                    <Icon name="shield" size={14} className="mt-px shrink-0" />
                    <span>
                      Send only on {method.network}. Crypto sent on the wrong network, or to a
                      wrong address, cannot be recovered by anyone. Include nothing but the
                      payment — put your reference in the email, not the transaction.
                    </span>
                  </p>
                </>
              ) : (
                <div className="mt-5 rounded-sm border border-rule bg-linen-deep p-5">
                  <p className="text-[0.95rem] leading-relaxed text-ink">
                    We will email <strong className="font-semibold">{primary.email}</strong> with
                    the {method?.label} details and the exact amount, usually within the hour.
                  </p>
                  <p className="u-meta mt-3 leading-relaxed text-shade">
                    Quote your reference in the payment note. Never send money to
                    {" "}{method?.label} details that did not come from that email.
                  </p>
                </div>
              )}
            </div>

            <p className="u-prose mt-5 text-[0.85rem] leading-relaxed text-mute">
              Keep this page or your reference. Delivery requires a government ID showing you
              are 21+, and someone 21+ must be present to receive it.
            </p>
          </div>

          <aside className="min-w-0">
            {rows.map((r) => {
              const mine = items.filter((i) => i.orderId === r.id);
              return (
                <div key={r.id} className="mb-5 rounded-md border border-rule bg-paper p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="u-data text-[1.15rem] font-semibold text-ink">{r.reference}</span>
                    <span className="u-meta rounded-pill px-2 py-0.5" style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}>
                      Awaiting payment
                    </span>
                  </div>
                  <p className="u-meta mt-2 text-shade">
                    {r.shop} · {r.eta}–{r.etaMax} min after payment clears
                  </p>

                  <ul className="mt-4 grid gap-2 border-t border-rule pt-4">
                    {mine.map((i) => (
                      <li key={i.id} className="flex items-baseline justify-between gap-3">
                        <span className="u-meta min-w-0 text-shade">
                          <span className="u-data text-ink">{i.qty}×</span> {i.nameSnapshot}
                        </span>
                        <span className="u-data shrink-0 text-[0.85rem] text-ink">
                          {money(i.unitPriceCents * i.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 grid gap-1 border-t border-rule pt-3">
                    <p className="u-meta flex justify-between text-shade">
                      <span>Subtotal</span><span className="u-data text-ink">{money(r.subtotal)}</span>
                    </p>
                    <p className="u-meta flex justify-between text-shade">
                      <span>Delivery</span><span className="u-data text-ink">{r.fee ? money(r.fee) : "Free"}</span>
                    </p>
                    <p className="mt-1 flex items-baseline justify-between">
                      <span className="u-label text-mute">Total</span>
                      <span className="u-data text-[1.35rem] font-semibold text-ink">{money(r.total)}</span>
                    </p>
                  </div>
                </div>
              );
            })}

            <p className="u-meta leading-relaxed text-mute">Delivering to {primary.address}</p>

            <Link href="/products" className="u-pill mt-5 inline-flex h-11 items-center gap-2 border border-ink px-5 text-[0.85rem] hover:bg-ink hover:text-linen">
              Keep shopping
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
