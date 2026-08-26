"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons";

/* Age verification is a legal condition of the category, not a marketing
   interstitial — so it is designed like the rest of the page rather than
   bolted on. Session-scoped: it asks once. */

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

  if (state !== "asking" && state !== "denied") return null;

  const accept = () => {
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch { /* private mode — ask again next load */ }
    setState("passed");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-[var(--gutter)] backdrop-blur-md"
    >
      <div className="w-full max-w-[440px] rounded-md border border-ink bg-linen p-8 sm:p-10">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-linen">
          <Icon name="pin" size={22} />
        </span>

        {state === "asking" ? (
          <>
            <h2 id="age-gate-title" className="u-display mt-6 text-[clamp(1.9rem,5vw,2.5rem)]">
              Are you 21 or over?
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-shade">
              You must be 21+ — or 18+ with a valid medical recommendation — to browse
              licensed cannabis retailers in your state.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={accept}
                className="u-pill flex h-12 items-center justify-center bg-ink px-6 text-[0.95rem] text-linen hover:bg-ink-soft"
              >
                Yes, I&rsquo;m 21 or over
              </button>
              <button
                type="button"
                onClick={() => setState("denied")}
                className="u-pill flex h-12 items-center justify-center border border-rule px-6 text-[0.95rem] text-ink-soft hover:border-ink hover:text-ink"
              >
                No, I&rsquo;m under 21
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="age-gate-title" className="u-display mt-6 text-[clamp(1.9rem,5vw,2.5rem)]">
              Come back in a few years.
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-shade">
              We can&rsquo;t show you licensed cannabis retailers until you&rsquo;re 21.
              Nothing personal.
            </p>
            <button
              type="button"
              onClick={() => setState("asking")}
              className="u-pill mt-8 flex h-12 items-center justify-center border border-rule px-6 text-[0.95rem] text-ink-soft hover:border-ink hover:text-ink"
            >
              I entered that wrong
            </button>
          </>
        )}

        <p className="mt-7 border-t border-rule pt-5 text-[0.8rem] leading-relaxed text-mute">
          Keep out of reach of children. Do not drive or operate machinery under the influence.
        </p>
      </div>
    </div>
  );
}
