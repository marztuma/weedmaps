import Link from "next/link";
import { notFound } from "next/navigation";
import { getShop, getShopMenu, getAllSlugs } from "@/db/queries";
import { Breadcrumb } from "@/components/PageHeader";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import Icon from "@/components/Icons";

export const revalidate = 60;

export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = await getShop(slug);
  if (!s) return {};
  return {
    title: `${s.name} — cannabis delivery — Weedmaps`,
    description: `${s.name} delivers to ${s.area} in ${s.eta}. ${s.menuCount} items, ${s.rating} stars.`,
  };
}

function Fact({ label, value, tone }) {
  return (
    <div className="border-t border-rule py-3">
      <dt className="u-label text-mute">{label}</dt>
      <dd className="u-data mt-1 text-[1rem]" style={tone ? { color: tone } : undefined}>
        {value}
      </dd>
    </div>
  );
}

export default async function DeliveryPage({ params }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();
  const menu = await getShopMenu(shop.id);
  const total = menu.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <div className="u-shell pt-[clamp(1.5rem,3vw,2.5rem)]">
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Delivery", href: "/deliveries" },
            { label: shop.name },
          ]}
        />
      </div>

      <section className="u-shell pb-[clamp(1.5rem,3vw,2.5rem)]">
        <div className="flex flex-col gap-x-12 gap-y-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="u-display text-[clamp(2rem,5.4vw,4rem)]">{shop.name}</h1>
              <span
                className="u-meta flex items-center gap-1.5 rounded-pill px-2.5 py-1"
                style={
                  shop.live
                    ? { backgroundColor: "var(--color-green-tint)", color: "var(--color-green-deep)" }
                    : { backgroundColor: "var(--color-rule-soft)", color: "var(--color-shade)" }
                }
              >
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: shop.live ? "var(--color-green-text)" : "var(--color-fade)" }}
                />
                {shop.live ? "Delivering now" : "Paused"}
              </span>
            </div>
            <p className="u-meta mt-3 text-shade">
              {shop.area} · {shop.license}
            </p>
            {shop.deal && (
              <p
                className="u-meta mt-4 inline-block rounded-pill px-3 py-1.5"
                style={{ backgroundColor: "var(--color-orange-tint)", color: "var(--color-orange-deep)" }}
              >
                {shop.deal}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Icon name="star" size={15} className="fill-orange text-orange" />
              <span className="u-data text-[1.15rem] font-semibold text-ink">{shop.rating.toFixed(1)}</span>
            </span>
            <span className="u-meta text-mute">{shop.reviews.toLocaleString("en-US")} reviews</span>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 sm:grid-cols-4 lg:grid-cols-5">
          <Fact label="Arrives in" value={shop.live ? shop.eta : shop.window} />
          <Fact label="Delivery fee" value={shop.fee === 0 ? "Free" : `$${shop.fee}`} />
          <Fact label="Order minimum" value={`$${shop.minOrder}`} />
          <Fact
            label="Free over"
            value={shop.freeOver != null ? `$${shop.freeOver}` : "—"}
          />
          <Fact label="Menu size" value={`${total} items`} />
        </dl>
      </section>

      <section className="u-tooth border-y border-rule bg-linen-deep">
        <div className="u-shell flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <span className="u-label text-mute">Jump to</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {menu.map((g) => (
              <li key={g.slug}>
                <a
                  href={`#${g.slug}`}
                  className="u-meta text-ink-soft decoration-orange/60 underline-offset-4 hover:text-ink hover:underline"
                >
                  {g.name} <span className="text-mute">{g.items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
        <h2 className="u-heading text-[clamp(1.55rem,3.1vw,2.6rem)]">
          {total} items on this menu
        </h2>

        {menu.map((group) => (
          <div key={group.slug} id={group.slug} className="mt-12 scroll-mt-[140px]">
            <div className="mb-5 flex items-end justify-between gap-6 border-b border-rule pb-3">
              <h3 className="text-[1.15rem] font-bold tracking-[-0.025em] text-ink">{group.name}</h3>
              <Link
                href={`/products/${group.slug}`}
                className="u-meta text-shade decoration-orange/60 underline-offset-4 hover:text-ink hover:underline"
              >
                All {group.name.toLowerCase()}
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {group.items.map((p, i) => (
                <Reveal as="li" key={p.id} index={Math.min(i % 5, 4)} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
