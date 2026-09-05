"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { subscribe } from "@/app/(shop)/subscribe-actions";
import { useCart } from "./CartContext";
import Icon from "./Icons";

/* The sign-in panel.
 *
 * It appears two ways, and the difference matters:
 *
 *   "cart"   — raised automatically the first time something goes in the bag.
 *              It stands in the way, so it cannot be dismissed while
 *              REQUIRE_EMAIL is true.
 *   "signin" — the header button. Somebody asked for it, so it closes on
 *              Escape, on the backdrop, and on its own close button, and
 *              dismissing it does not count as having answered the gate.
 *
 * What "signed in" means here, stated plainly because the word promises more
 * than this does: there is no password and no account. Leaving an address
 * records it, ties this browser to it, and lets the shop confirm an order.
 * The server grants that address nothing — it cannot read another person's
 * orders, and nothing on this site is unlocked by typing it. Anything more
 * would need real authentication, and pretending otherwise in the interface
 * would be the dishonest half of the deal.
 *
 * Two things stay deliberately separate:
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
 * REQUIRE_EMAIL is the one dial. Left true, the automatic panel must be
 * satisfied before shopping continues. Set it false and it becomes an offer
 * people can wave away — fewer addresses, better ones.
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
  const {
    gateOpen: open, gateReason, closeGate: onClose,
    identity, setIdentity, signOut,
  } = useCart();

  const [state, action, pending] = useActionState(subscribe, null);
  const [visitorKey, setVisitorKey] = useState("");
  const panel = useRef(null);

  // A panel somebody opened themselves can always be closed again; only the
  // one that interrupts them is allowed to insist.
  const insists = REQUIRE_EMAIL && gateReason === "cart";

  useEffect(() => {
    try { setVisitorKey(localStorage.getItem("wm-visitor") ?? ""); } catch { /* blocked */ }
  }, []);

  // Remember the answer, whichever way it went, and remember who it was.
  useEffect(() => {
    if (!state?.ok) return;
    try { localStorage.setItem(KEY, "done"); } catch { /* blocked */ }
    if (state.email) setIdentity(state.email);
    const t = setTimeout(onClose, 1600);
    return () => clearTimeout(t);
  }, [state?.ok, state?.email, setIdentity, onClose]);

  useEffect(() => {
    if (!open || insists) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, insists, onClose]);

  if (!open) return null;

  const onBackdrop = (e) => {
    if (!insists && !panel.current?.contains(e.target)) onClose();
  };

  const shell = (children) => (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      onMouseDown={onBackdrop}
    >
      <div
        ref={panel}
        className="relative w-full max-w-[27rem] rounded-sm border border-rule bg-linen p-6 shadow-2xl sm:p-8"
      >
        {!insists && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-mute transition-colors duration-200 hover:bg-linen-deep hover:text-ink"
          >
            <Icon name="close" size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );

  /* Already known on this browser, and they pressed the button anyway. Show
     them what the site actually holds, rather than asking again. */
  if (identity && gateReason === "signin" && !state?.ok) {
    return shell(
      <>
        <h2 id="gate-title" className="u-heading text-[1.5rem] leading-tight">
          Signed in as
        </h2>
        <p className="u-data mt-2 break-all text-[1.05rem] text-ink">{identity}</p>
        <p className="u-prose mt-3 text-[0.9rem] leading-relaxed text-shade">
          We use this to confirm your orders and send delivery updates. There is no password
          and no account to lock — this browser simply remembers the address so checkout can
          fill it in for you.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="u-pill mt-6 flex h-12 w-full items-center justify-center bg-ink px-6 text-[0.95rem] font-semibold text-linen hover:bg-ink-soft"
        >
          Keep shopping
        </button>
        <button
          type="button"
          onClick={() => { signOut(); onClose(); }}
          className="mt-3 h-11 w-full text-[0.85rem] text-mute underline-offset-4 hover:text-ink hover:underline"
        >
          Forget this address on this device
        </button>
      </>
    );
  }

  if (state?.ok) {
    return shell(
      <>
        <h2 id="gate-title" className="u-heading text-[1.5rem]">You&rsquo;re in.</h2>
        <p className="u-prose mt-2 text-[0.95rem] leading-relaxed text-shade">{state.message}</p>
      </>
    );
  }

  const cart = gateReason === "cart";

  return shell(
    <>
      <h2 id="gate-title" className="u-heading text-[1.55rem] leading-tight">
        {cart ? "Added to your bag." : "Sign in with your email."}
      </h2>
      <p className="u-prose mt-2 text-[0.95rem] leading-relaxed text-shade">
        {cart
          ? "Leave an email so we can send your order updates — and the codes, if you want them."
          : "No password to remember. Leave your address and this browser will know you at checkout."}
      </p>

      <form action={action} className="mt-5">
        <input type="hidden" name="source" value={cart ? "cart-gate" : "header"} />
        <input type="hidden" name="visitorKey" value={visitorKey} />
        {/* The marketing is offered here, never demanded — see subscribe(). */}
        <input type="hidden" name="consentRequired" value="no" />

        <label className="block">
          <span className="sr-only">Your email</span>
          <input
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            defaultValue={identity ?? ""}
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
          {pending ? "One moment…" : cart ? "Continue shopping" : "Sign in"}
        </button>

        {!insists && (
          <button
            type="button"
            onClick={onClose}
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
  );
}

export { alreadyAnswered, KEY as GATE_KEY };
