"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Icon from "./Icons";

export default function ActiveDeliveryCarousel({ shops }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  // Get only live/active shops
  const activeShops = (shops ?? []).filter((s) => s.live).slice(0, 10);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!autoRotate || activeShops.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeShops.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRotate, activeShops.length]);

  if (activeShops.length === 0) return null;

  const current = activeShops[currentIndex];

  return (
    <section className="u-shell py-[clamp(2rem,4vw,3.5rem)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="u-heading text-[clamp(1.5rem,2.5vw,2rem)]">
          🚗 Delivering Now
        </h2>
        <span className="u-meta text-mute">
          {currentIndex + 1} / {activeShops.length}
        </span>
      </div>

      <div className="relative">
        {/* Carousel Card */}
        <div
          className="overflow-hidden rounded-lg border border-rule bg-gradient-to-br from-linen-deep/30 to-transparent p-6 md:p-8 transition-all duration-300"
          onMouseEnter={() => setAutoRotate(false)}
          onMouseLeave={() => setAutoRotate(true)}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center">
            {/* Content */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center gap-1 rounded-full bg-green-tint px-2.5 py-1">
                  <span className="block h-2 w-2 rounded-full bg-green-text animate-pulse" />
                  <span className="u-meta text-[0.75rem] font-semibold text-green-deep">
                    Delivering Now
                  </span>
                </span>
              </div>

              <h3 className="text-[1.5rem] md:text-[1.75rem] font-bold text-ink mb-1">
                {current.name}
              </h3>

              <p className="u-meta text-shade mb-4">
                {current.area} · {current.state}
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <Icon name="star" size={16} className="fill-orange text-orange" />
                  <span className="text-[0.9rem] font-medium text-ink">
                    {current.rating.toFixed(1)}
                  </span>
                  <span className="u-meta text-mute">
                    ({current.reviews.toLocaleString()})
                  </span>
                </div>

                <span className="u-meta text-shade">
                  <Icon name="truck" size={14} className="inline mr-1 text-fade" />
                  Arrives in {current.eta}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                <span className="u-meta text-[0.85rem] px-3 py-1.5 rounded-full bg-ink/5 text-ink">
                  {current.fee === 0 ? "🎉 Free delivery" : `💰 $${current.fee} fee`}
                </span>
                <span className="u-meta text-[0.85rem] px-3 py-1.5 rounded-full bg-ink/5 text-ink">
                  📦 Min ${current.minOrder}
                </span>
                <span className="u-meta text-[0.85rem] px-3 py-1.5 rounded-full bg-ink/5 text-ink">
                  🛍️ {current.menuCount} items
                </span>
                {current.deal && (
                  <span className="u-meta text-[0.85rem] px-3 py-1.5 rounded-full bg-orange-tint text-orange-deep font-semibold">
                    ✨ {current.deal}
                  </span>
                )}
              </div>

              <Link
                href={`/delivery/${current.slug}`}
                className="inline-flex items-center gap-2 bg-ink text-linen px-4 py-2.5 rounded-full font-semibold text-[0.9rem] hover:bg-ink-soft transition-colors"
              >
                View Menu
                <Icon name="arrowUpRight" size={16} />
              </Link>
            </div>

            {/* Stats */}
            <div className="hidden md:flex flex-col items-end gap-6 text-right">
              <div className="text-center">
                <p className="text-4xl font-bold text-ink mb-1">
                  {activeShops.length}
                </p>
                <p className="u-meta text-mute text-[0.85rem]">
                  Services<br />Delivering Now
                </p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-orange mb-1">
                  ⚡
                </p>
                <p className="u-meta text-mute text-[0.85rem]">
                  Instant<br />Delivery
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {activeShops.length > 1 && (
          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + activeShops.length) % activeShops.length
                )
              }
              className="grid h-10 w-10 place-items-center rounded-full border border-rule hover:bg-rule transition-colors"
              aria-label="Previous"
            >
              <Icon name="chevronLeft" size={18} className="text-ink" />
            </button>

            {/* Dots */}
            <div className="flex gap-1.5 justify-center flex-1">
              {activeShops.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? "bg-ink w-8" : "bg-rule w-2 hover:bg-rule-soft"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeShops.length)}
              className="grid h-10 w-10 place-items-center rounded-full border border-rule hover:bg-rule transition-colors"
              aria-label="Next"
            >
              <Icon name="chevronRight" size={18} className="text-ink" />
            </button>
          </div>
        )}
      </div>

      {/* Info Text */}
      <p className="u-meta mt-6 text-center text-shade text-[0.9rem]">
        ✨ Carousel updates every 5 seconds · Showing services currently delivering
      </p>
    </section>
  );
}
