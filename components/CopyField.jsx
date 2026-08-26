"use client";

import { useState } from "react";
import Icon from "./Icons";

/* A wallet address is worthless if it is retyped wrong, so it ships as a
   selectable, copyable block set in mono — never as prose. */
export default function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard blocked — the text is still selectable by hand
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <span className="u-label text-mute">{label}</span>
      <div className="mt-1.5 flex items-stretch gap-2">
        <code className="u-data min-w-0 flex-1 break-all rounded-xs border border-ink bg-linen-deep px-3 py-2.5 text-[0.85rem] leading-relaxed text-ink">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="u-pill flex h-auto shrink-0 items-center gap-1.5 border border-ink px-4 text-[0.8rem] font-bold text-ink hover:bg-ink hover:text-linen"
        >
          <Icon name={copied ? "check" : "bag"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
