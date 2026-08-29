"use client";

import { useActionState, useState } from "react";
import { submitReview } from "@/app/(shop)/review-actions";

/* Leave a rating.

   The star input is a radio group, not a row of buttons: it is one choice out
   of five, which is what a radio group is, and it arrives with keyboard
   support, arrow-key movement and a real value in the form for free. The
   labels carry the visible stars; the inputs themselves are visually hidden
   rather than display:none, so they stay focusable and announceable.

   The whole thing is a plain form posting to a server action, so it submits
   without JavaScript. useActionState only adds the inline result. */

const STAR_PATH =
  "M12 2.4l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.2l6.5-.9z";

const WORD = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Great", 5: "Excellent" };

export default function ReviewForm({ target, subjectLabel }) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(0);
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <div className="mt-8 border-t border-rule pt-6">
        <p className="u-prose text-[0.95rem] leading-relaxed text-ink">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 border-t border-rule pt-6">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="u-pill inline-flex h-11 items-center bg-ink px-5 text-[0.9rem] font-semibold text-linen hover:bg-ink-soft"
        >
          Write a review
        </button>
      )}

      <form action={action} className={open ? "block" : "hidden"}>
        {target.productId && <input type="hidden" name="productId" value={target.productId} />}
        {target.shopId && <input type="hidden" name="shopId" value={target.shopId} />}
        <input type="hidden" name="path" value={target.path} />

        <fieldset>
          <legend className="u-label text-mute">Your rating of {subjectLabel}</legend>
          <div className="mt-3 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <label
                key={n}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors duration-200 hover:bg-linen"
                title={`${n} — ${WORD[n]}`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  required
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="sr-only"
                />
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d={STAR_PATH}
                    fill={n <= rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className={n <= rating ? "text-orange" : "text-rule"}
                  />
                </svg>
                <span className="sr-only">
                  {n} star{n === 1 ? "" : "s"} — {WORD[n]}
                </span>
              </label>
            ))}
            {rating > 0 && (
              <span className="u-meta ml-2 text-shade">{WORD[rating]}</span>
            )}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="u-label text-mute">Name or handle</span>
            <input
              name="author"
              required
              maxLength={48}
              autoComplete="nickname"
              className="mt-1.5 h-11 w-full rounded-sm border border-rule bg-linen px-3 text-[0.95rem] text-ink outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="u-label text-mute">Where you are (optional)</span>
            <input
              name="location"
              maxLength={96}
              placeholder="Los Angeles, CA"
              className="mt-1.5 h-11 w-full rounded-sm border border-rule bg-linen px-3 text-[0.95rem] text-ink outline-none focus:border-ink"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="u-label text-mute">Headline (optional)</span>
          <input
            name="title"
            maxLength={120}
            className="mt-1.5 h-11 w-full rounded-sm border border-rule bg-linen px-3 text-[0.95rem] text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="mt-4 block">
          <span className="u-label text-mute">Your review (optional)</span>
          <textarea
            name="body"
            rows={4}
            maxLength={4000}
            className="mt-1.5 w-full rounded-sm border border-rule bg-linen p-3 text-[0.95rem] leading-relaxed text-ink outline-none focus:border-ink"
          />
        </label>

        {state?.error && (
          <p className="u-meta mt-3 text-orange-text" role="alert">
            {state.error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="u-pill inline-flex h-11 items-center bg-ink px-5 text-[0.9rem] font-semibold text-linen hover:bg-ink-soft disabled:opacity-60"
          >
            {pending ? "Sending…" : "Post review"}
          </button>
          <p className="u-meta text-mute">Checked before it appears.</p>
        </div>
      </form>
    </div>
  );
}
