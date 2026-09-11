/* The wordmark.
 *
 * Live text in the site's own face rather than outlined paths. It stays crisp
 * at every size, inherits the theme, is selectable and searchable, and — the
 * reason that matters most — it cannot drift from the site's typography,
 * because it *is* the site's typography.
 *
 * The arc is a delivery arc: it leaves the start of the word and lands on a
 * point, which is the shape of the job. It curves up rather than down and sits
 * in the project's orange.
 *
 * `Mark` is the companion for places a wordmark cannot survive — a 32px
 * favicon, an app icon, the admin bar. It is the same arc and the same landing
 * point inside a rounded tile, so the two read as one family rather than two
 * unrelated drawings.
 */

const ORANGE = "#f15a26";

/**
 * @param {object}  props
 * @param {number} [props.height]  rendered height in px; the width follows
 * @param {"ink"|"linen"} [props.tone]  colour of the word itself
 * @param {string} [props.className]
 */
export function Wordmark({ height = 30, tone = "ink", className = "" }) {
  const word = tone === "linen" ? "#f9f5f2" : "#141314";
  // 250×66 is the drawn box; height scales the whole lockup.
  const width = Math.round((250 / 66) * height);

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 250 66"
      role="img"
      aria-label="Weedmaps"
      className={className}
      focusable="false"
    >
      <text
        x="0"
        y="40"
        fontFamily="var(--font-manrope), system-ui, sans-serif"
        fontSize="42"
        fontWeight="800"
        letterSpacing="-2.2"
        fill={word}
      >
        weedmaps
      </text>
    </svg>
  );
}

/**
 * The compact mark. Square, so it drops into a favicon, an app icon or a
 * 32px slot without a wrapper deciding its proportions.
 */
export function Mark({ size = 32, tone = "ink", className = "" }) {
  const tile = tone === "linen" ? "#f9f5f2" : "#141314";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Weedmaps"
      className={className}
      focusable="false"
    >
      <rect width="64" height="64" rx="16" fill={tile} />
    </svg>
  );
}

export default Wordmark;
