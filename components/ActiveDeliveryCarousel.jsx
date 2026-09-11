"use client";

import Link from "next/link";
import Icon from "./Icons";

export default function ActiveDeliveryCarousel({ shops }) {
  // Get only live/active shops
  const activeShops = (shops ?? []).filter((s) => s.live).slice(0, 10);

  if (activeShops.length === 0) return null;

  return (
    <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="u-heading text-[clamp(1.5rem,2.5vw,2rem)]">
          🚗 Delivering Now
        </h2>
        <span className="u-meta text-mute">
          {activeShops.length} services available
        </span>
      </div>

      {/* List View */}
      <div className="space-y-4">
        {activeShops.map((shop) => (
          <div key={shop.id} className="border border-rule rounded-lg p-4 md:p-6 bg-linen hover:border-ink transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 md:items-center">
              {/* Logo/Image */}
              <div className="hidden md:block h-24 w-24 rounded-lg bg-linen-deep overflow-hidden flex-shrink-0">
                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-mute">
                    <Icon name="pin" size={32} />
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-[1.1rem] font-bold text-ink">
                    {shop.name}
                  </h3>
                  <span className="flex items-center gap-1 rounded-full bg-green-tint px-2.5 py-1">
                    <span className="block h-1.5 w-1.5 rounded-full bg-green-text animate-pulse" />
                    <span className="u-meta text-[0.7rem] font-semibold text-green-deep">
                      Delivering
                    </span>
                  </span>
                </div>

                <p className="u-meta text-shade mb-3">
                  {shop.area} · {shop.license}
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Icon name="star" size={15} className="fill-orange text-orange" />
                    <span className="text-[0.9rem] font-medium text-ink">
                      {shop.rating.toFixed(1)}
                    </span>
                    <span className="u-meta text-mute">
                      ({shop.reviews.toLocaleString()})
                    </span>
                  </div>

                  <span className="u-meta text-shade text-[0.9rem]">
                    <Icon name="truck" size={13} className="inline mr-1 text-fade" />
                    {shop.eta}
                  </span>

                  <span className="u-meta text-shade text-[0.9rem]">
                    {shop.fee === 0 ? "Free delivery" : `$${shop.fee} fee`} · ${shop.minOrder} min
                  </span>
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-[0.85rem]">
                  {shop.categories && Object.entries(shop.categories).map(([cat, count]) => (
                    <div key={cat} className="text-shade">
                      <Icon name={cat === "flower" ? "flower" : cat === "edibles" ? "edibles" : "gear"} size={12} className="inline mr-1" />
                      <span className="font-medium text-ink">{count}</span>
                      <span className="text-mute"> {cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <Link
                href={`/delivery/${shop.slug}`}
                className="inline-flex items-center justify-center gap-2 bg-ink text-linen px-5 py-2.5 rounded-full font-semibold text-[0.9rem] hover:bg-ink-soft transition-colors whitespace-nowrap h-fit"
              >
                View menu
                <Icon name="arrowUpRight" size={15} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
