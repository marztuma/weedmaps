"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/* Reports a page view.
 *
 * usePathname rather than a one-shot on mount, because this is an App Router
 * site where most navigation never reloads the document — a mount-only beacon
 * would record the first page of a session and nothing after it.
 *
 * sendBeacon where available: it survives the page being closed, which is
 * exactly when the last view of a session happens and exactly when a fetch
 * gets cancelled. Everything is wrapped, because analytics failing must never
 * be visible to a visitor.
 */

const KEY = "wm-visitor";

function visitorKey() {
  try {
    let k = localStorage.getItem(KEY);
    if (!k || !/^[a-z0-9]{16,48}$/.test(k)) {
      k = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(36).padStart(2, "0"))
        .join("")
        .slice(0, 32);
      localStorage.setItem(KEY, k);
    }
    return k;
  } catch {
    return null; // storage blocked — do not track rather than track badly
  }
}

export default function Track() {
  const pathname = usePathname();

  useEffect(() => {
    /* Respect the browser's own signal. Do Not Track is widely ignored, which
       is not a reason to ignore it. */
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;

    const k = visitorKey();
    if (!k || !pathname) return;

    const body = JSON.stringify({ k, p: pathname, r: document.referrer || null });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // never surface
    }
  }, [pathname]);

  return null;
}
