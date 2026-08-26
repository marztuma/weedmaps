import Link from "next/link";
import Icon from "@/components/Icons";

export const metadata = { title: "Not found — Weedmaps" };

export default function NotFound() {
  return (
    <section className="u-shell flex min-h-[60vh] flex-col items-center justify-center py-[clamp(3rem,8vw,6rem)] text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-rule text-fade">
        <Icon name="search" size={24} />
      </span>

      <h1 className="u-display mt-6 max-w-[16ch] text-[clamp(2rem,5.4vw,4rem)]">
        Nothing on this shelf.
      </h1>

      <p className="u-prose mt-4 text-[0.95rem] leading-relaxed text-shade">
        That page does not exist — the product may have sold out, or the service may have
        stopped delivering to this address.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="u-pill flex h-11 items-center gap-2 bg-ink px-5 text-[0.85rem] text-linen hover:bg-ink-soft"
        >
          Browse the shelf
          <Icon name="arrow" size={16} />
        </Link>
        <Link
          href="/deliveries"
          className="u-pill flex h-11 items-center gap-2 border border-ink px-5 text-[0.85rem] hover:bg-ink hover:text-linen"
        >
          Who is delivering
        </Link>
      </div>
    </section>
  );
}
