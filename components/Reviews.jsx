"use client";

import { useState } from "react";
import Link from "next/link";
import Stars from "./Stars";
import Reveal from "./Reveal";
import ReviewForm from "./ReviewForm";

/* Reviews for a product or a delivery service.

   Two counts, not one. Most people leave a star and no words, so the summary
   says "N ratings · M reviews" and means it — reporting the first number as
   the second is the small dishonesty most listings commit.

   The star filter lives in component state rather than the URL. Reading
   searchParams here would force the page dynamic, and putting it behind a
   Suspense boundary made the whole section client-only — the server rendered
   nothing, so every review was invisible to crawlers and to anyone without
   JavaScript. Server-rendering the full list and filtering it in the browser
   keeps the words in the HTML, which is what actually matters here. The cost
   is that a filtered view is not a shareable URL. */

function ago(date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

function Distribution({ distribution, ratings, activeStar, onPick }) {
  return (
    <ul className="mt-5 flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const n = distribution[star] ?? 0;
        const pct = ratings ? Math.round((n / ratings) * 100) : 0;
        const on = activeStar === star;
        return (
          <li key={star}>
            <button
              type="button"
              onClick={() => onPick(on ? null : star)}
              aria-pressed={on}
              disabled={n === 0}
              aria-label={`${n} ${star}-star ${n === 1 ? "rating" : "ratings"}${on ? ", clear filter" : ", filter to these"}`}
              className={`flex h-11 w-full items-center gap-3 rounded-sm px-2 -mx-2 text-left transition-colors duration-200 disabled:cursor-default disabled:opacity-60 ${
                on ? "bg-linen" : "enabled:hover:bg-linen"
              }`}
            >
              <span className={`u-data w-8 shrink-0 text-[0.8rem] ${on ? "text-ink" : "text-shade"}`}>
                {star}★
              </span>
              <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-pill bg-rule">
                <span
                  className="block h-full rounded-pill bg-orange"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="u-data w-9 shrink-0 text-right text-[0.8rem] text-mute">{n}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function Reviews({ summary, subjectLabel, target }) {
  const [activeStar, setActiveStar] = useState(null);

  const { items: all, ratings, written, average, distribution } = summary;
  // The server sends every published review; the star filter is a view of them.
  const items = activeStar ? all.filter((r) => r.rating === activeStar) : all;

  return (
    <section id="reviews" className="u-tooth border-t border-rule bg-linen-deep">
      <div className="u-shell py-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="u-heading text-[clamp(1.55rem,3.1vw,2.4rem)]">Reviews</h2>

        <div className="mt-8 grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            {ratings > 0 ? (
              <>
                <div className="flex items-end gap-4">
                  <span className="u-display-thin text-[clamp(2.6rem,6vw,4rem)] leading-none text-ink">
                    {average.toFixed(1)}
                  </span>
                  <div className="pb-1.5">
                    <Stars value={average} count={ratings} size={17} />
                    <p className="u-meta mt-1.5 text-mute">
                      {ratings} {ratings === 1 ? "rating" : "ratings"} · {written}{" "}
                      {written === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>
                <Distribution
                  distribution={distribution}
                  ratings={ratings}
                  activeStar={activeStar}
                  onPick={setActiveStar}
                />
              </>
            ) : (
              <div>
                <p className="u-prose text-[1rem] leading-relaxed text-shade">
                  No reviews yet for {subjectLabel}.
                </p>
                <p className="u-prose mt-2 text-[0.9rem] leading-relaxed text-mute">
                  Ratings appear here once a customer leaves one and it has been
                  checked.
                </p>
              </div>
            )}

            <ReviewForm target={target} subjectLabel={subjectLabel} />
          </div>

          <div className="min-w-0">
            {activeStar && (
              <p className="u-meta mb-4 flex items-center gap-3 text-mute">
                Showing {activeStar}-star only
                <button
                  type="button"
                  onClick={() => setActiveStar(null)}
                  className="u-pill inline-flex h-11 items-center border border-rule px-3 text-ink-soft hover:border-ink hover:text-ink"
                >
                  Show all
                </button>
              </p>
            )}

            {items.length === 0 ? (
              <p className="u-prose text-[0.95rem] leading-relaxed text-mute">
                {activeStar
                  ? `Nobody has left a ${activeStar}-star review yet.`
                  : "Nothing written yet — be the first."}
              </p>
            ) : (
              <ul>
                {items.map((r, i) => (
                  <Reveal as="li" key={r.id} index={Math.min(i, 3)} className="border-t border-rule py-5 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Stars value={r.rating} size={14} />
                      {r.title && (
                        <span className="text-[1rem] font-bold tracking-[-0.02em] text-ink">
                          {r.title}
                        </span>
                      )}
                    </div>
                    {r.body && (
                      <p className="u-prose mt-2.5 text-[0.95rem] leading-relaxed text-shade">
                        {r.body}
                      </p>
                    )}
                    <p className="u-meta mt-3 text-mute">
                      {r.author}
                      {r.location ? ` · ${r.location}` : ""} · {ago(r.createdAt)}
                    </p>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
