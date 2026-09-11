"use client";

import { useEffect, useState, useActionState } from "react";
import { subscribe } from "@/app/(shop)/subscribe-actions";
import Icon from "./Icons";

/* Age verification integrated into email subscription flow. Session-scoped. */

const KEY = "wm-age-ok";

export default function AgeGate() {
  const [state, setState] = useState("checking");

  useEffect(() => {
    let ok = null;
    try {
      ok = window.sessionStorage.getItem(KEY);
    } catch {
      ok = null;
    }
    setState(ok === "1" ? "passed" : "asking");
  }, []);

  useEffect(() => {
    if (state === "asking") {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [state]);

  if (state !== "asking") return null;

  const handleSubscribe = () => {
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch { /* private mode */ }
    setState("passed");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-[var(--gutter)] backdrop-blur-md"
    >
      <div className="w-full max-w-[440px] rounded-md border border-ink bg-linen p-8 sm:p-10">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-linen">
          <Icon name="pin" size={22} />
        </span>

        <h2 id="restock-title" className="u-display mt-6 text-[clamp(1.9rem,5vw,2.5rem)]">
          Restock Alerts
        </h2>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-shade">
          Be first to hear when something is back in stock, and when new flavours and drops land.
          One email, only when there&rsquo;s something worth saying.
        </p>

        <div className="mt-8">
          <SubscribeWithAgeHandler onSubscribe={handleSubscribe} />
        </div>

        <p className="mt-6 border-t border-rule pt-5 text-[0.8rem] leading-relaxed text-mute">
          For adults 21 and over. We never sell your information.
        </p>
      </div>
    </div>
  );
}

function SubscribeWithAgeHandler({ onSubscribe }) {
  return (
    <SubscribeFormWrapper source="age-gate" onSubscribe={onSubscribe} />
  );
}

function SubscribeFormWrapper({ source, onSubscribe }) {
  const [state, action, pending] = useActionState(subscribe, null);
  const [visitorKey, setVisitorKey] = useState("");

  useEffect(() => {
    try { setVisitorKey(localStorage.getItem("wm-visitor") ?? ""); } catch { /* blocked storage */ }
  }, []);

  useEffect(() => {
    if (state?.ok) {
      try {
        window.sessionStorage.setItem(KEY, "1");
      } catch { /* private mode */ }
      onSubscribe();
    }
  }, [state?.ok, onSubscribe]);

  if (state?.ok) {
    return (
      <p className="u-prose text-[0.95rem] leading-relaxed text-ink">{state.message}</p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="visitorKey" value={visitorKey} />

      <label>
        <span className="sr-only">Your email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@email.com"
          className="h-12 w-full rounded-sm border border-rule bg-linen px-3.5 text-[0.95rem] text-ink outline-none focus:border-ink"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-2.5">
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

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border-rule text-ink accent-ink"
        />
        <span className="u-prose text-[0.85rem] leading-relaxed text-shade">
          Email me restock alerts and product news. Unsubscribe anytime. See our Privacy Policy.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="u-pill w-full flex h-12 items-center justify-center bg-ink px-6 text-[0.95rem] font-semibold text-linen hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Subscribing…" : "Subscribe"}
      </button>

      {state?.error && (
        <p className="u-meta text-orange-text" role="alert">{state.error}</p>
      )}
    </form>
  );
}
