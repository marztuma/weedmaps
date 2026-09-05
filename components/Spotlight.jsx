"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QuickAdd } from "./AddToCart";
import Icon from "./Icons";
import { price } from "@/lib/money";
import { resolveProductImage } from "@/lib/images";

/* The spotlight — a rotating advertisement for two kinds of thing.
 *
 * It sits directly under the headline because that is the one place on the
 * page where a visitor has read a claim ("27 services are delivering") and has
 * not yet been given anything to act on. A shelf answers "what is there"; this
 * answers "what should I look at first".
 *
 * Every slide states why it is here, and the reason is a fact from the
 * database rather than a mood:
 *
 *   BEST SELLER carries the actual unit count from the order book.
 *   ON PROMO carries the actual percentage off the previous price.
 *
 * That constraint is what stops this becoming the kind of banner people have
 * learned to look past. A badge reading "popular" with nothing behind it is
 * noise; a badge reading "14 sold" is information, and getSpotlight() returns
 * no seller slides at all rather than let the badge lie.
 *
 * Motion rules, which are not decoration:
 *   - It pauses on hover, on keyboard focus, and when the tab is hidden.
 *   - There is a real pause button, because WCAG 2.2.2 requires one for
 *     anything that moves for more than five seconds beside other content.
 *   - prefers-reduced-motion turns autoplay off entirely and drops the slide
 *     transition; the arrows and the picker still work, so nothing is lost.
 *   - Off-screen slides are inert, so a keyboard cannot tab into a slide
 *     nobody can see.
 */

const DWELL = 6500;

function Badge({ slide }) {
  if (slide.reason === "seller") {
    return (
      <span className="u-meta inline-flex items-center gap-2 rounded-pill bg-orange px-3 py-1.5 text-ink">
        <Icon name="star" size={12} />
        Best seller · {slide.sold} sold
      </span>
    );
  }
  const off = Math.round(((slide.was - slide.price) / slide.was) * 100);
  return (
    <span className="u-meta inline-flex items-center gap-2 rounded-pill bg-linen px-3 py-1.5 text-ink">
      <Icon name="clock" size={12} />
      On promo · {off}% off today
    </span>
  );
}

function Slide({ slide, active, index, total }) {
  const photo = resolveProductImage(slide, "hero");

  return (
    <li
      className="w-full shrink-0"
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${slide.name}`}
      aria-hidden={!active}
      inert={!active}
    >
      <div className="grid h-full md:grid-cols-[1fr_minmax(0,44%)]">
        {/* Copy first in the source order, so a screen reader and a crawler
            both meet the offer before the picture of it. */}
        <div className="order-2 flex flex-col justify-center gap-4 p-6 sm:p-9 md:order-1 md:p-11">
          <div className="flex flex-wrap items-center gap-3">
            <Badge slide={slide} />
            <span className="u-meta text-fade">{slide.brand}</span>
          </div>

          <h3 className="u-display text-[clamp(1.7rem,3.6vw,3rem)] leading-[1.02] text-linen">
            <Link
              href={`/product/${slide.slug}`}
              className="decoration-orange/70 underline-offset-[6px] hover:underline"
            >
              {slide.name}
            </Link>
          </h3>

          <p className="u-meta flex flex-wrap items-center gap-x-2.5 gap-y-1 text-fade">
            {slide.type && <span className="text-linen">{slide.type}</span>}
            {slide.weight && <><span aria-hidden="true">/</span><span>{slide.weight}</span></>}
            {slide.thc > 0 && <><span aria-hidden="true">/</span><span>THC {slide.thc}%</span></>}
          </p>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="u-data text-[clamp(1.6rem,3vw,2.35rem)] font-semibold leading-none text-linen">
              {price(slide.price)}
            </span>
            {slide.was && (
              <>
                <s className="u-data text-[0.95rem] text-fade">{price(slide.was)}</s>
                <span className="u-meta text-orange">save {price(slide.was - slide.price)}</span>
              </>
            )}
          </div>

          <p className="u-meta flex items-start gap-1.5 leading-relaxed text-fade">
            <Icon name="truck" size={12} className="mt-[3px] shrink-0" />
            <span>
              {slide.shop}
              <span aria-hidden="true"> · </span>
              <span className="whitespace-nowrap">{slide.eta}</span>
            </span>
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            {slide.shopLive !== false && (
              <div className="w-[10.5rem]">
                <QuickAdd
                  product={slide}
                  className="!border-linen !text-linen hover:!bg-linen hover:!text-ink"
                />
              </div>
            )}
            <Link
              href={`/product/${slide.slug}`}
              className="u-pill inline-flex h-11 items-center gap-1.5 px-1 text-[0.8rem] font-bold text-fade underline-offset-4 hover:text-linen hover:underline"
            >
              See the product
              <Icon name="arrowUpRight" size={14} />
            </Link>
          </div>
        </div>

        {/* The pack shots are tall (4:5) and this panel is wide, so covering
            it cropped the top off the packaging — on an advertisement, the one
            crop you cannot afford. Contained on the same off-white the
            photographs were shot against, the whole product shows and the
            ink-to-linen edge becomes a deliberate split rather than a seam. */}
        <div className="relative order-1 aspect-[16/10] overflow-hidden bg-paper md:order-2 md:aspect-auto md:min-h-[clamp(21rem,30vw,25rem)]">
          {photo ? (
            <img
              src={photo.src ?? photo.webp ?? photo.avif}
              srcSet={photo.srcSet ?? undefined}
              sizes="(max-width: 768px) 100vw, 44vw"
              alt={photo.alt}
              /* All eight load, none of them lazily. An off-screen slide sits
                 outside the clipping box, so a lazy image there is not fetched
                 until the slide arrives — and the first thing anyone pressing
                 next would see is a blank white panel. They are small pack
                 shots; the first is prioritised because it is the LCP, and the
                 rest are explicitly deprioritised so they queue behind it. */
              loading="eager"
              fetchPriority={index === 0 ? "high" : "low"}
              decoding="async"
              /* Otherwise a drag across the picture starts Chrome native image
                 drag-and-drop, which swallows the pointerup and kills the
                 swipe. */
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain p-5 sm:p-7"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <Icon name={slide.category ?? "flower"} size={44} className="text-mute" />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function Spotlight({ slides = [] }) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);       // hover, focus, or hidden tab
  const [stopped, setStopped] = useState(false); // the pause button
  const [still, setStill] = useState(false);     // prefers-reduced-motion

  const n = slides.length;
  const go = useCallback((next) => setI((c) => (next + n) % n), [n]);

  /* Swipe, because on a phone the arrows sit at the bottom of the panel and
     the floating help button can sit over them. A carousel you can only
     advance with a 36px target is a carousel most people never advance.
     Pointer events cover touch, pen and a mouse drag with one path. */
  const drag = useRef(null);
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY };
    /* Capture so the release is reported here even if the finger ends up over
       a link or leaves the panel. Vertical scrolling still works, because
       touch-pan-y leaves that gesture to the browser, and the cancel that
       scrolling produces is handled. */
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
  };
  const onPointerUp = (e) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    // Horizontal intent only: a vertical scroll that wanders sideways is not
    // a swipe, and treating it as one makes the page feel possessed.
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    go(dx < 0 ? i + 1 : i - 1);
  };

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(m.matches);
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, []);

  // A carousel advancing in a background tab is only ever a spent battery.
  useEffect(() => {
    const onVis = () => setHeld(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const running = n > 1 && !held && !stopped && !still;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => go(i + 1), DWELL);
    return () => clearTimeout(t);
  }, [running, i, go]);

  if (n === 0) return null;

  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  };

  return (
    <section
      className="u-shell pb-[clamp(2.5rem,5vw,4rem)]"
      aria-roledescription="carousel"
      aria-label="Best sellers and current promotions"
    >
      <div
        onMouseEnter={() => setHeld(true)}
        onMouseLeave={() => setHeld(false)}
        onFocusCapture={() => setHeld(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
        }}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; }}
        className="touch-pan-y overflow-hidden rounded-sm bg-ink"
      >
        <ul
          className="flex"
          style={{
            transform: `translateX(-${i * 100}%)`,
            transition: still ? "none" : "transform 700ms var(--ease-out-expo)",
          }}
        >
          {slides.map((s, k) => (
            <Slide key={s.id} slide={s} index={k} total={n} active={k === i} />
          ))}
        </ul>
      </div>

      {n > 1 && (
        <div className="mt-3 flex items-center gap-3 sm:gap-4">
          {/* Progress doubles as the picker. The bars are proportional, so one
              glance answers both "where am I" and "how long have I got". */}
          <ul className="flex flex-1 items-center gap-1.5">
            {slides.map((s, k) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(k)}
                  aria-label={`Show slide ${k + 1}: ${s.name}`}
                  aria-current={k === i ? "true" : undefined}
                  className="group flex h-6 w-full items-center"
                >
                  <span className="relative block h-[3px] w-full overflow-hidden rounded-pill bg-rule group-hover:bg-fade">
                    {k === i && (
                      <span
                        key={`${i}-${running}`}
                        className="absolute inset-y-0 left-0 block bg-orange"
                        style={
                          running
                            ? { animation: `u-spotlight ${DWELL}ms linear forwards` }
                            : { width: "100%" }
                        }
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {!still && (
            <button
              type="button"
              onClick={() => setStopped((v) => !v)}
              aria-label={stopped ? "Resume the carousel" : "Pause the carousel"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rule text-ink-soft transition-colors duration-200 hover:border-ink hover:text-ink"
            >
              {stopped ? (
                <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor" aria-hidden="true">
                  <path d="M0 0l11 6-11 6z" />
                </svg>
              ) : (
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
                  <rect width="3" height="12" />
                  <rect x="7" width="3" height="12" />
                </svg>
              )}
            </button>
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(i - 1)}
              aria-label="Previous slide"
              className="grid h-9 w-9 place-items-center rounded-full border border-rule text-ink-soft transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-linen"
            >
              <Icon name="chevronLeft" size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(i + 1)}
              aria-label="Next slide"
              className="grid h-9 w-9 place-items-center rounded-full border border-rule text-ink-soft transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-linen"
            >
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
