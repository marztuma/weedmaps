"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartContext";
import Icon from "./Icons";

export default function CartDrawer() {
  const { open, setOpen, groups, count, subtotal, setQty, remove, clear } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button
        type="button"
        aria-label="Close bag"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        className="relative flex h-full w-full max-w-[460px] flex-col border-l border-ink bg-linen"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-rule px-6 py-4">
          <h2 className="u-heading text-[1.35rem]">
            Your bag {count > 0 && <span className="u-data text-mute">{count}</span>}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-linen-deep"
          >
            <Icon name="close" size={20} />
          </button>
        </header>

        {groups.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full border border-rule text-fade">
              <Icon name="bag" size={24} />
            </span>
            <p className="u-heading mt-5 text-[1.35rem]">Nothing in the bag yet.</p>
            <p className="u-prose mt-2 text-[0.9rem] text-shade">
              Add something from a service that is delivering and it will land here.
            </p>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="u-pill mt-6 inline-flex h-11 items-center bg-ink px-5 text-[0.9rem] text-linen hover:bg-ink-soft"
            >
              Browse the shelf
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* One group per delivery service: separate drivers, separate orders. */}
              {groups.map((g) => (
                <section key={g.shop} className="mb-8 last:mb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-ink pb-2">
                    <h3 className="text-[1rem] font-bold tracking-[-0.025em] text-ink">{g.shop}</h3>
                    <p className="u-meta text-shade">{g.eta}</p>
                  </div>

                  <ul>
                    {g.lines.map((l) => (
                      <li key={l.slug} className="flex gap-3 border-b border-rule-soft py-4">
                        <div className="min-w-0 flex-1">
                          <p className="u-meta truncate text-mute">{l.brand}</p>
                          <Link
                            href={`/product/${l.slug}`}
                            onClick={() => setOpen(false)}
                            className="mt-0.5 block truncate text-[0.95rem] font-bold tracking-[-0.02em] text-ink decoration-orange/60 underline-offset-4 hover:underline"
                          >
                            {l.name}
                          </Link>
                          <p className="u-meta mt-1 text-shade">{l.weight}</p>

                          <div className="mt-2.5 flex items-center gap-2">
                            <div className="flex items-center rounded-pill border border-rule">
                              <button
                                type="button"
                                onClick={() => setQty(l.slug, l.qty - 1)}
                                aria-label={`Decrease ${l.name}`}
                                className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-linen-deep"
                              >
                                <Icon name="minus" size={14} />
                              </button>
                              <span className="u-data w-7 text-center text-[0.85rem] font-semibold">{l.qty}</span>
                              <button
                                type="button"
                                onClick={() => setQty(l.slug, l.qty + 1)}
                                aria-label={`Increase ${l.name}`}
                                className="grid h-11 w-11 place-items-center rounded-full text-ink hover:bg-linen-deep"
                              >
                                <Icon name="plus" size={14} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(l.slug)}
                              aria-label={`Remove ${l.name}`}
                              className="grid h-11 w-11 place-items-center rounded-full text-mute hover:bg-linen-deep hover:text-ink"
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </div>

                        <p className="u-data shrink-0 text-[0.95rem] font-semibold text-ink">
                          ${(l.price * l.qty).toFixed(0)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-col gap-1.5">
                    <p className="u-meta flex justify-between text-shade">
                      <span>Subtotal</span>
                      <span className="u-data text-ink">${g.subtotal.toFixed(0)}</span>
                    </p>
                    <p className="u-meta flex justify-between text-shade">
                      <span>Delivery</span>
                      <span className="u-data text-ink">{g.fee ? `$${g.fee}` : "Free"}</span>
                    </p>

                    {!g.meetsMinimum ? (
                      <p
                        className="u-meta mt-1.5 rounded-xs px-3 py-2 leading-relaxed"
                        style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}
                      >
                        Add ${g.shortfall.toFixed(0)} more to reach {g.shop}&rsquo;s ${g.min} minimum.
                      </p>
                    ) : (
                      <Link
                        href="/checkout"
                        onClick={() => setOpen(false)}
                        className="u-pill mt-2 flex h-11 w-full items-center justify-center gap-2 bg-ink px-5 text-[0.85rem] text-linen hover:bg-ink-soft"
                      >
                        <Icon name="truck" size={15} />
                        Checkout with {g.shop} · ${g.total.toFixed(0)}
                      </Link>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <footer className="shrink-0 border-t border-ink px-6 py-5">
              <p className="flex items-baseline justify-between">
                <span className="u-label text-mute">
                  {groups.length === 1 ? "1 order" : `${groups.length} separate orders`}
                </span>
                <span className="u-data text-[1.5rem] font-semibold text-ink">
                  ${subtotal.toFixed(0)}
                </span>
              </p>
              <p className="u-meta mt-2 leading-relaxed text-shade">
                Each service checks out on its own menu — one driver cannot carry another
                company&rsquo;s stock. 21+ and ID at the door.
              </p>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="u-pill mt-4 flex h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-[0.95rem] text-linen hover:bg-ink-soft"
              >
                <Icon name="arrow" size={17} />
                Go to checkout
              </Link>
              <button
                type="button"
                onClick={clear}
                className="u-meta mt-3 block w-full text-center text-mute underline decoration-rule underline-offset-4 hover:text-ink"
              >
                Empty the bag
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
