"use client";

import { useActionState, useEffect, useState } from "react";
import { subscribe } from "@/app/(shop)/subscribe-actions";

/* The signup form with integrated age verification.
 *
 * Age check is a legal requirement, not a marketing gate. Both age and consent
 * boxes are required and start unticked. A pre-ticked box is not consent under
 * the GDPR and is a poor idea under CAN-SPAM.
 */

const AGE_KEY = "wm-age-ok";

export default function Subscribe({ source = "site", compact = false }) {
  const [state, action, pending] = useActionState(subscribe, null);
  const [visitorKey, setVisitorKey] = useState("");

  useEffect(() => {
    try { setVisitorKey(localStorage.getItem("wm-visitor") ?? ""); } catch { /* blocked storage */ }
  }, []);

  useEffect(() => {
    if (state?.ok && source === "age-gate") {
      try {
        window.sessionStorage.setItem(AGE_KEY, "1");
      } catch { /* private mode */ }
    }
  }, [state?.ok, source]);

  if (state?.ok) {
    return (
      <p className="u-prose text-[0.95rem] leading-relaxed text-ink">{state.message}</p>
    );
  }

  return (
    <form action={action} className={compact ? "" : "max-w-[34rem]"}>
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="visitorKey" value={visitorKey} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Your email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="h-12 w-full rounded-sm border border-rule bg-linen px-3.5 text-[0.95rem] text-ink outline-none focus:border-ink"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="u-pill inline-flex h-12 shrink-0 items-center justify-center bg-ink px-6 text-[0.95rem] font-semibold text-linen hover:bg-ink-soft disabled:opacity-60"
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          name="ageVerified"
          required
          className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border-rule text-ink accent-ink"
        />
        <span className="u-prose text-[0.85rem] leading-relaxed text-shade">
          I confirm I am 21 or over (or 18+ with valid medical recommendation) to receive
          cannabis retailer information and deals.
        </span>
      </label>

      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border-rule text-ink accent-ink"
        />
        <span className="u-prose text-[0.85rem] leading-relaxed text-shade">
          Email me discount codes and new arrivals. A few times a month, never sold on,
          and every email has a one-click unsubscribe.
        </span>
      </label>

      {state?.error && (
        <p className="u-meta mt-3 text-orange-text" role="alert">{state.error}</p>
      )}
    </form>
  );
}
