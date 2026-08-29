"use client";

import { price } from "@/lib/money";

import { useState } from "react";
import { useCart } from "./CartContext";
import Icon from "./Icons";

export default function AddToCart({ product, disabled, disabledLabel }) {
  /* An untracked product (stock === null) has no ceiling — nobody is counting,
     which is not the same as none left. Only a tracked count constrains the
     stepper, and only a tracked zero blocks the button. */
  const max = product.tracked ? product.stock : null;
  const soldOut = product.tracked && product.stock <= 0;
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="u-pill flex h-12 w-full items-center justify-center gap-2 border border-rule px-6 text-[0.95rem] text-mute"
      >
        Out of stock
      </button>
    );
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="u-pill mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 bg-rule px-6 text-[0.95rem] text-mute"
      >
        {disabledLabel ?? "Not delivering right now"}
      </button>
    );
  }

  // 99 is the arbitrary UI ceiling; stock is the real one when it is counted.
  const ceiling = max != null ? Math.min(99, Math.max(1, max)) : 99;
  const step = (d) => setQty((q) => Math.max(1, Math.min(ceiling, q + d)));

  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <div className="flex h-12 shrink-0 items-center rounded-pill border border-ink">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className="grid h-12 w-12 place-items-center rounded-full text-ink transition-colors duration-200 hover:bg-linen-deep disabled:text-fade disabled:hover:bg-transparent"
        >
          <Icon name="minus" size={16} />
        </button>
        <span className="u-data w-9 text-center text-[1rem] font-semibold" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={max != null && qty >= max}
          aria-label="Increase quantity"
          className="grid h-12 w-12 place-items-center rounded-full text-ink transition-colors duration-200 hover:bg-linen-deep"
        >
          <Icon name="plus" size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          add(product, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1800);
        }}
        className="u-pill flex h-12 flex-1 items-center justify-center gap-2 bg-ink px-6 text-[0.95rem] text-linen hover:bg-ink-soft"
      >
        <Icon name={added ? "check" : "bag"} size={17} />
        {added ? "Added to bag" : `Add to bag · ${price(product.price * qty)}`}
      </button>
    </div>
  );
}

/** Compact variant for grids and rails. */
export function QuickAdd({ product, className = "" }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (product.tracked && product.stock <= 0) {
    return (
      <span
        className={`u-pill flex h-11 w-full items-center justify-center gap-1.5 border border-rule text-[0.8rem] font-bold text-mute ${className}`}
      >
        Out of stock
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add(product, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      aria-label={`Add ${product.name} to bag`}
      className={`u-pill flex h-11 w-full items-center justify-center gap-1.5 border border-ink text-[0.8rem] font-bold text-ink transition-colors duration-200 hover:bg-ink hover:text-linen ${className}`}
    >
      <Icon name={added ? "check" : "plus"} size={14} />
      {added ? "Added" : "Add to bag"}
    </button>
  );
}
