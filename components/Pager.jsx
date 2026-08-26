import Link from "next/link";
import Icon from "./Icons";

/* Pagination for a listing.

   Plain links, rendered on the server. No client state, no JavaScript: a page
   of the catalogue is an address, so it can be shared, bookmarked, opened in a
   new tab and crawled. Existing filters travel with it — paging inside a
   subcategory keeps the subcategory.

   Every target is 44px, the floor this project holds for anything a thumb has
   to hit. That has been broken twice here by new controls, so it is written
   once as a constant rather than retyped per element. */

const HIT = "grid h-11 min-w-11 place-items-center px-3";

/** Page numbers to show: always the first and last, always a window around the
 *  current page, with gaps marked rather than silently skipped. */
function windowed(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) out.push("gap-before");
  for (let n = from; n <= to; n++) out.push(n);
  if (to < pages - 1) out.push("gap-after");
  out.push(pages);
  return out;
}

export default function Pager({ page, pages, total, perPage, basePath, params = {} }) {
  if (pages <= 1) return null;

  /* Page 1 is the bare path, not ?page=1. One page, one address — otherwise the
     same goods answer to two URLs and a crawler has to work out they are one. */
  const href = (n) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v != null && v !== "") q.set(k, v);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <nav aria-label="Pagination" className="mt-10 border-t border-rule pt-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="u-data text-[0.8rem] text-mute">
          {first}&ndash;{last} of {total}
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-1.5">
          <li>
            {page > 1 ? (
              <Link
                href={href(page - 1)}
                rel="prev"
                aria-label="Previous page"
                className={`${HIT} u-pill border border-rule text-ink-soft hover:border-ink hover:text-ink`}
              >
                <Icon name="chevronLeft" size={15} />
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className={`${HIT} u-pill border border-rule/60 text-mute/50`}
              >
                <Icon name="chevronLeft" size={15} />
              </span>
            )}
          </li>

          {windowed(page, pages).map((n) =>
            typeof n === "string" ? (
              <li key={n} aria-hidden="true" className="u-data px-1 text-[0.8rem] text-mute">
                &hellip;
              </li>
            ) : (
              <li key={n}>
                <Link
                  href={href(n)}
                  aria-label={`Page ${n}`}
                  aria-current={n === page ? "page" : undefined}
                  className={`${HIT} u-pill u-data text-[0.8rem] font-semibold ${
                    n === page
                      ? "bg-ink text-linen"
                      : "border border-rule text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {n}
                </Link>
              </li>
            )
          )}

          <li>
            {page < pages ? (
              <Link
                href={href(page + 1)}
                rel="next"
                aria-label="Next page"
                className={`${HIT} u-pill border border-rule text-ink-soft hover:border-ink hover:text-ink`}
              >
                <Icon name="chevronRight" size={15} />
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className={`${HIT} u-pill border border-rule/60 text-mute/50`}
              >
                <Icon name="chevronRight" size={15} />
              </span>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
