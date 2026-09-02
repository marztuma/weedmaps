"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { subscribe } from "@/app/(shop)/subscribe-actions";
import { useCart } from "./CartContext";

/* The sign-in gate.
 *
 * Appears the first time someone puts something in the bag, and asks for an
 * address before they carry on.
 *
 * Two things are deliberately separate, and the separation is what keeps this
 * from damaging the shop:
 *
 *   The address gets the person through the gate.
 *   The tick box is what makes them mailable.
 *
 * They are not the same decision and the law does not treat them as the same
 * decision. An address handed over to get past a wall is not consent to be
 * marketed to, and subscribe() records consentedAt as null when the box is
 * unticked — which the campaign query already excludes. So the gate can be as
 * firm as you like without quietly building a list that generates spam
 * complaints.
 *
 * That matters beyond the law: this shop's order confirmations and payment
 * receipts go out through the same domain as its marketing. A list full of
 * addresses people invented to get past a wall bounces, the domain's
 * reputation falls, and the first casualty is a customer not receiving the
 * wallet address they are supposed to pay.
 *
 * REQUIRE_EMAIL is the one dial. Left true, the gate must be satisfied before
 * shopping continues. Set it false and the modal becomes an offer people can
 * wave away — fewer addresses, better ones.
 */

const REQUIRE_EMAIL = true;

const KEY = "wm-gate-v1";

/** Has this browser already answered? Kept per-browser rather than per-session,
 *  so somebody who signed up last week is not asked again on every visit. */
function alreadyAnswered() {
  try {
    return localStorage.getItem(KEY) === "done";
  } catch {
    // Storage blocked. Asking on every page would be worse than not asking.
    return true;
  }
}

export default function SignInGate() {
  /* The cart raises the flag, because every way of adding something already
     goes through it. Hanging this off the add buttons instead would mean the
     next button somebody writes quietly skips the gate. */
  const { gateOpen: open, closeGate: onClose } = useCart();
  const [state, action, pending] = useActionState(subscribe, null);
  const [visitorKey, setVisitorKey] = useState("");

  useEffect(() => {
    try { setVisitorKey(localStorage.getItem("wm-visitor") ?? ""); } catch { /* blocked */ }
  }, []);

  // Remember the answer, whichever way it went.
  useEffect(() => {
    if (state?.ok) {
      try { localStorage.setItem(KEY, "done"); } catch { /* blocked */ }
      const t = setTimeout(onClose, 1400);
      return () => clearTimeout(t);
    }
  }, [state?.ok, onClose]);

  // Escape closes it when the gate is soft; a required gate ignores Escape.
  useEffect(() => {
    if (!open || REQUIRE_EMAIL) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const skip = () => {
    try { localStorage.setItem(KEY, "done"); } catch { /* blocked */ }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
    >
      <div className="w-full max-w-[27rem] rounded-sm border border-rule bg-linen p-6 shadow-2xl sm:p-8">
        {state?.ok ? (
          <>
            <h2 id="gate-title" className="u-heading text-[1.5rem]">You're in.</h2>
            <p className="u-prose mt-2 text-[0.95rem] leading-relaxed text-shade">{state.message}</p>
          </>
        ) : (
          <>
            <h2 id="gate-title" className="u-heading text-[1.55rem] leading-tight">
              Added to your bag.
            </h2>
            <p className="u-prose mt-2 text-[0.95rem] leading-relaxed text-shade">
              Leave an email so we can send your order updates — and the codes, if you want them.
            </p>

            <form action={action} className="mt-5">
              <input type="hidden" name="source" value="cart-gate" />
              <input type="hidden" name="visitorKey" value={visitorKey} />

              <label className="block">
                <span className="sr-only">Your email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xs border border-rule bg-paper px-3.5 text-[0.95rem] text-ink outline-none focus:border-orange"
                />
              </label>

              {/* Required to be mailable, not required to continue. Unticked,
                  because a pre-ticked box is not consent. */}
              <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-xs border-rule accent-ink"
                />
                <span className="u-prose text-[0.85rem] leading-relaxed text-shade">
                  Also send me discount codes and new arrivals. A few times a month, never sold
                  on, one-click unsubscribe in every email.
                </span>
              </label>

              {state?.error && (
                <p className="u-meta mt-3 text-orange-text" role="alert">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="u-pill mt-5 flex h-12 w-full items-center justify-center bg-ink px-6 text-[0.95rem] font-semibold text-linen hover:bg-ink-soft disabled:opacity-60"
              >
                {pending ? "One moment…" : "Continue shopping"}
              </button>

              {!REQUIRE_EMAIL && (
                <button
                  type="button"
                  onClick={skip}
                  className="mt-3 h-11 w-full text-[0.85rem] text-mute underline-offset-4 hover:text-ink hover:underline"
                >
                  Not now
                </button>
              )}

              <p className="u-meta mt-4 text-center text-mute">
                We never sell your address, and you can leave the list in one click.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export { alreadyAnswered, KEY as GATE_KEY };
