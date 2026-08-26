"use client";

import Link from "next/link";
import Icon from "@/components/Icons";

/* A page that cannot reach the database must say so in the product's own voice
   and offer a way forward — never a blank frame or an untranslated stack. */
export default function Error({ error, reset }) {
  return (
    <section className="u-shell flex min-h-[60vh] flex-col items-center justify-center py-[clamp(3rem,8vw,6rem)] text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-rule text-fade">
        <Icon name="truck" size={24} />
      </span>

      <h1 className="u-display mt-6 max-w-[16ch] text-[clamp(2rem,5.4vw,4rem)]">
        We lost the menu for a second.
      </h1>

      <p className="u-prose mt-4 text-[0.95rem] leading-relaxed text-shade">
        Something went wrong loading this page. It is usually momentary — try again, and if
        it keeps happening the shelf is still browsable from the homepage.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="u-pill flex h-11 items-center gap-2 bg-ink px-5 text-[0.85rem] text-linen hover:bg-ink-soft"
        >
          <Icon name="arrow" size={16} />
          Try again
        </button>
        <Link
          href="/"
          className="u-pill flex h-11 items-center gap-2 border border-ink px-5 text-[0.85rem] hover:bg-ink hover:text-linen"
        >
          Back to the shelf
        </Link>
      </div>

      {error?.digest && (
        <p className="u-meta mt-8 text-mute">Reference {error.digest}</p>
      )}
    </section>
  );
}
