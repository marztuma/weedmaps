"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/* Delivery-only has a consequence the cart has to honour: one driver cannot
   carry another company's stock. A cart is therefore grouped by delivery
   service, each group carrying its own fee, minimum and arrival window, and
   each group checks out on its own. Pretending otherwise would produce a total
   nobody could actually order. */

const KEY = "wm-cart-v1";
const CartContext = createContext(null);

function read() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  /* Raised the first time something is added, unless this browser has already
     answered. Read once on mount rather than on every add, so a slow storage
     call cannot sit in the middle of a click. */
  const [gateOpen, setGateOpen] = useState(false);
  const [gateAnswered, setGateAnswered] = useState(true);

  /* Why the panel is on screen, which decides what it says and whether it can
     be waved away. "cart" is the automatic one and stands in the way of
     shopping; "signin" is the header button, which somebody pressed on
     purpose and can therefore close again. */
  const [gateReason, setGateReason] = useState("cart");

  /* The address this browser last gave, if any. It is a convenience and a
     label, not an authentication — there is no password behind it and the
     server grants it nothing. It exists so the header can stop asking
     somebody who has already answered, and so checkout can pre-fill. */
  const [identity, setIdentityState] = useState(null);

  useEffect(() => {
    try {
      setGateAnswered(localStorage.getItem("wm-gate-v1") === "done");
      setIdentityState(localStorage.getItem("wm-identity"));
    } catch {
      // Storage blocked — never ask, rather than ask on every page.
      setGateAnswered(true);
    }
  }, []);

  const [lines, setLines] = useState([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Tell the stylesheet the client is alive, which disarms the reveal
    // failsafe. If this never runs, content un-hides itself instead.
    document.documentElement.classList.add("js-ready");
    setLines(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* private mode — the cart simply won't survive a reload */
    }
  }, [lines, ready]);

  const add = useCallback((product, qty = 1) => {
    if (!gateAnswered) { setGateReason("cart"); setGateOpen(true); }
    setLines((prev) => {
      const i = prev.findIndex((l) => l.slug === product.slug);
      if (i !== -1) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(next[i].qty + qty, 99) };
        return next;
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: product.price,
          was: product.was ?? null,
          weight: product.weight,
          category: product.category,
          colorway: product.colorway,
          type: product.type,
          thc: product.thc,
          cbd: product.cbd,
          shop: product.shop,
          shopSlug: product.shopSlug ?? null,
          eta: product.eta,
          shopFee: product.shopFee ?? null,
          shopMin: product.shopMin ?? null,
          qty,
        },
      ];
    });
    setOpen(true);
    // add() reads gateAnswered, so it has to be rebuilt when that changes —
    // otherwise it keeps closing over the initial value forever and the
    // gate never opens.
  }, [gateAnswered]);

  const setQty = useCallback((slug, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, qty: Math.min(qty, 99) } : l))
    );
  }, []);

  const remove = useCallback((slug) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  /* Opened from the header rather than by adding something. It is offered, not
     imposed, so closing it must not be recorded as having answered — otherwise
     idly opening and shutting the panel would silently disarm the gate that
     the first add-to-bag is supposed to raise. */
  const openGate = useCallback((reason = "signin") => {
    setGateReason(reason);
    setGateOpen(true);
  }, []);

  const closeGate = useCallback(() => {
    setGateOpen(false);
    // Only the automatic panel records an answer. Dismissing the one you asked
    // for yourself leaves the gate armed for the first add to bag.
    if (gateReason === "cart") setGateAnswered(true);
  }, [gateReason]);

  const setIdentity = useCallback((email) => {
    setIdentityState(email);
    try {
      if (email) localStorage.setItem("wm-identity", email);
      else localStorage.removeItem("wm-identity");
    } catch { /* private mode — it simply will not survive a reload */ }
  }, []);

  /* Signing out forgets the label. It deliberately does not touch the gate
     flag: this browser has already been asked once, and asking again the
     moment somebody tidies up after themselves would be a punishment. Nor
     does it unsubscribe — that is a different decision, and the link for it
     is in every email. */
  const signOut = useCallback(() => setIdentity(null), [setIdentity]);

  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);

    // group by service — each is a separate order
    const map = new Map();
    for (const l of lines) {
      if (!map.has(l.shop)) {
        map.set(l.shop, {
          shop: l.shop,
          shopSlug: l.shopSlug,
          eta: l.eta,
          fee: l.shopFee,
          min: l.shopMin,
          lines: [],
        });
      }
      map.get(l.shop).lines.push(l);
    }
    const groups = [...map.values()].map((g) => {
      const sub = g.lines.reduce((n, l) => n + l.price * l.qty, 0);
      const shortfall = g.min != null ? Math.max(0, g.min - sub) : 0;
      return {
        ...g,
        subtotal: sub,
        shortfall,
        meetsMinimum: shortfall === 0,
        total: sub + (g.fee ?? 0),
      };
    });

    return {
      lines, groups, count, subtotal, ready, open, setOpen,
      add, setQty, remove, clear,
      gateOpen, gateReason, openGate, closeGate,
      identity, setIdentity, signOut,
    };
  }, [lines, ready, open, add, setQty, remove, clear,
      gateOpen, gateReason, openGate, closeGate, identity, setIdentity, signOut]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
