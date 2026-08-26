"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icons";

export default function SearchField({ defaultValue = "", autoFocus = false, onDone }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    onDone?.();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form role="search" onSubmit={submit} className="flex items-center gap-3">
      <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-rule pb-2 focus-within:border-orange">
        <Icon name="search" size={20} className="shrink-0 text-mute" />
        <span className="sr-only">Search products, brands and categories</span>
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Strain, brand, category…"
          className="w-full min-w-0 bg-transparent text-[1.05rem] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-mute"
        />
      </label>
      <button
        type="submit"
        className="u-pill flex h-11 shrink-0 items-center gap-2 bg-ink px-5 text-[0.85rem] text-linen hover:bg-ink-soft"
      >
        Search
      </button>
    </form>
  );
}
