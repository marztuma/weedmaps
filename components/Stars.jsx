/* A star rating, drawn rather than typed.

   Five glyphs with the filled ones coloured is the obvious approach and it is
   wrong for two reasons: a 4.4 cannot be drawn in whole glyphs, and a screen
   reader announces "star star star star star" with no value in it. This draws
   one row of outlines with a clipped row of filled stars over the top, so a
   fraction is exact, and puts the number in the accessible name so the value
   is what gets announced. */

const STAR =
  "M12 2.4l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.2l6.5-.9z";

export default function Stars({ value = 0, count, size = 15, className = "" }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const label = count == null
    ? `${value} out of 5`
    : `${value} out of 5, ${count} ${count === 1 ? "rating" : "ratings"}`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={label}
    >
      <span className="relative inline-block leading-none" style={{ height: size }}>
        <span className="flex" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none">
              <path d={STAR} stroke="currentColor" strokeWidth="1.6" className="text-rule" />
            </svg>
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0 text-orange">
              <path d={STAR} fill="currentColor" />
            </svg>
          ))}
        </span>
      </span>
    </span>
  );
}
