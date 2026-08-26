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
  }, []);

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
    };
  }, [lines, ready, open, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
