"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useCart } from "./CartContext";
import { useDelivery } from "./DeliveryContext";
import { placeOrder } from "@/app/(shop)/checkout/actions";
import Icon from "./Icons";

function Submit({ disabled }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="u-pill flex h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-[0.95rem] text-linen hover:bg-ink-soft disabled:cursor-not-allowed disabled:bg-rule disabled:text-mute"
    >
      <Icon name="check" size={17} />
      {pending ? "Placing your order…" : "Place order"}
    </button>
  );
}

export default function CheckoutForm({ methods }) {
  const { lines, groups, subtotal, count } = useCart();
  const { location } = useDelivery();
  const [state, action] = useActionState(placeOrder, {});

  const apps = methods.filter((m) => m.kind === "app");
  const crypto = methods.filter((m) => m.kind === "crypto");
  const deliveryTotal = groups.reduce((n, g) => n + (g.fee ?? 0), 0);
  const blocked = groups.filter((g) => !g.meetsMinimum);

  if (count === 0) {
    return (
      <section className="u-shell py-[clamp(3rem,7vw,5rem)] text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-rule text-fade">
          <Icon name="bag" size={24} />
        </span>
        <h2 className="u-heading mt-5 text-[1.35rem]">Your bag is empty.</h2>
        <p className="u-prose mx-auto mt-2 text-[0.95rem] text-shade">
          Add something from a service that is delivering, then come back here.
        </p>
        <Link href="/products" className="u-pill mt-6 inline-flex h-11 items-center bg-ink px-5 text-[0.9rem] text-linen hover:bg-ink-soft">
          Browse the shelf
        </Link>
      </section>
    );
  }

  return (
    <form action={action} className="u-shell pb-[clamp(3rem,6vw,5rem)]">
      <input type="hidden" name="cart" value={JSON.stringify(lines.map((l) => ({ slug: l.slug, qty: l.qty })))} />

      {state?.errors?.length > 0 && (
        <div className="mb-8 rounded-md border border-orange bg-orange-tint/40 p-5" role="alert">
          <p className="u-label text-orange-deep">We could not place that order</p>
          <ul className="mt-2 grid gap-1">
            {state.errors.map((e) => (
              <li key={e} className="text-[0.95rem] leading-relaxed text-ink">{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0">
          <section>
            <h2 className="u-heading text-[clamp(1.3rem,2.4vw,1.75rem)]">Where it goes</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="u-label text-mute">Name the driver should ask for</span>
                <input name="name" required className="mt-1.5 h-12 w-full rounded-xs border border-rule bg-paper px-3 text-[0.95rem] text-ink outline-none focus:border-orange" />
              </label>
              <label className="block">
                <span className="u-label text-mute">Email</span>
                <input name="email" type="email" required className="mt-1.5 h-12 w-full rounded-xs border border-rule bg-paper px-3 text-[0.95rem] text-ink outline-none focus:border-orange" />
                <span className="u-meta mt-1 block text-mute">Payment details and updates go here.</span>
              </label>
              <label className="block">
                <span className="u-label text-mute">Phone</span>
                <input name="phone" inputMode="tel" className="mt-1.5 h-12 w-full rounded-xs border border-rule bg-paper px-3 text-[0.95rem] text-ink outline-none focus:border-orange" />
              </label>
              <label className="block">
                <span className="u-label text-mute">Delivery address</span>
                <input name="address" required defaultValue={location} className="mt-1.5 h-12 w-full rounded-xs border border-rule bg-paper px-3 text-[0.95rem] text-ink outline-none focus:border-orange" />
              </label>
              <label className="block sm:col-span-2">
                <span className="u-label text-mute">Notes for the driver</span>
                <textarea name="notes" rows={3} className="mt-1.5 w-full rounded-xs border border-rule bg-paper p-3 text-[0.95rem] leading-relaxed text-ink outline-none focus:border-orange" placeholder="Buzzer code, gate, where to leave it…" />
              </label>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="u-heading text-[clamp(1.3rem,2.4vw,1.75rem)]">How you want to pay</h2>
            <p className="u-prose mt-2 text-[0.9rem] leading-relaxed text-shade">
              Every method here is arranged after the order is placed. Nothing is charged now,
              and no payment is confirmed until a person checks the funds arrived.
            </p>

            <fieldset className="mt-5">
              <legend className="u-label text-mute">Apps</legend>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {apps.map((m) => (
                  <label key={m.code} className="flex cursor-pointer items-start gap-3 rounded-sm border border-rule bg-paper p-4 transition-colors duration-200 has-[:checked]:border-ink hover:border-ink">
                    <input type="radio" name="method" value={m.code} required className="mt-1 accent-[var(--color-orange)]" />
                    <span className="min-w-0">
                      <span className="block text-[1rem] font-bold tracking-[-0.02em] text-ink">{m.label}</span>
                      <span className="u-meta mt-1 block leading-relaxed text-shade">Details sent by email</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="u-label text-mute">Crypto</legend>
              <div className="mt-2 grid gap-2.5">
                {crypto.map((m) => (
                  <label key={m.code} className="flex cursor-pointer items-start gap-3 rounded-sm border border-rule bg-paper p-4 transition-colors duration-200 has-[:checked]:border-ink hover:border-ink">
                    <input type="radio" name="method" value={m.code} required className="mt-1 accent-[var(--color-orange)]" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="text-[1rem] font-bold tracking-[-0.02em] text-ink">{m.label}</span>
                        <span className="u-meta text-mute">{m.network}</span>
                      </span>
                      <span className="u-meta mt-1 block leading-relaxed text-shade">
                        Address shown after you place the order · {m.confirmations} confirmations
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-8 flex cursor-pointer items-start gap-3">
              <input type="checkbox" name="age" required className="mt-1 accent-[var(--color-orange)]" />
              <span className="u-prose text-[0.9rem] leading-relaxed text-shade">
                I am 21 or over (or 18+ with a valid medical recommendation), and someone 21+
                with government ID will be present to receive the delivery.
              </span>
            </label>
          </section>
        </div>

        {/* Order summary */}
        <aside className="min-w-0">
          <div className="sticky top-[132px] rounded-md border border-ink bg-paper p-6">
            <h2 className="u-heading text-[1.15rem]">Your order</h2>

            {groups.map((g) => (
              <section key={g.shop} className="mt-5 border-t border-rule pt-4 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-[0.95rem] font-bold tracking-[-0.02em] text-ink">{g.shop}</h3>
                  <span className="u-meta text-shade">{g.eta}</span>
                </div>

                <ul className="mt-3 grid gap-2">
                  {g.lines.map((l) => (
                    <li key={l.slug} className="flex items-baseline justify-between gap-3">
                      <span className="u-meta min-w-0 text-shade">
                        <span className="u-data text-ink">{l.qty}×</span> {l.name}
                      </span>
                      <span className="u-data shrink-0 text-[0.85rem] text-ink">
                        ${(l.price * l.qty).toFixed(0)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 grid gap-1">
                  <p className="u-meta flex justify-between text-shade">
                    <span>Subtotal</span><span className="u-data text-ink">${g.subtotal.toFixed(0)}</span>
                  </p>
                  <p className="u-meta flex justify-between text-shade">
                    <span>Delivery</span><span className="u-data text-ink">{g.fee ? `$${g.fee}` : "Free"}</span>
                  </p>
                  {!g.meetsMinimum && (
                    <p className="u-meta mt-1 rounded-xs px-3 py-2 leading-relaxed" style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}>
                      ${g.shortfall.toFixed(0)} below {g.shop}&rsquo;s ${g.min} minimum.
                    </p>
                  )}
                </div>
              </section>
            ))}

            <div className="mt-5 border-t border-ink pt-4">
              <p className="u-meta flex justify-between text-shade">
                <span>Items</span><span className="u-data text-ink">${subtotal.toFixed(0)}</span>
              </p>
              <p className="u-meta mt-1 flex justify-between text-shade">
                <span>Delivery</span><span className="u-data text-ink">{deliveryTotal ? `$${deliveryTotal}` : "Free"}</span>
              </p>
              <p className="mt-3 flex items-baseline justify-between">
                <span className="u-label text-mute">
                  {groups.length === 1 ? "Total" : `${groups.length} orders`}
                </span>
                <span className="u-data text-[1.75rem] font-semibold text-ink">
                  ${(subtotal + deliveryTotal).toFixed(0)}
                </span>
              </p>
            </div>

            <div className="mt-5">
              <Submit disabled={blocked.length > 0} />
              {blocked.length > 0 && (
                <p className="u-meta mt-2 text-center leading-relaxed text-orange-text">
                  Add more to reach every service&rsquo;s minimum first.
                </p>
              )}
              <p className="u-meta mt-3 text-center leading-relaxed text-mute">
                Placing the order does not pay for it. You get payment details next.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
