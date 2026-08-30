import Link from "next/link";
import { sql, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { SITE_URL } from "@/lib/seo";
import learn from "@/data/learn.json";

export const dynamic = "force-dynamic";

/* Search — what this site actually offers a crawler.
 *
 * The counts are the live ones, computed the same way lib/site-map-data.js
 * computes them. A page that reports a sitemap's contents from a different
 * query than the sitemap uses will eventually report a sitemap that does not
 * exist.
 *
 * The exclusions are listed as prominently as the inclusions, because "why is
 * this page not indexed" is the question this screen exists to answer. */

export default async function Seo() {
  const [[counts]] = await Promise.all([
    db.select({
      products: sql`(select count(*) from ${schema.products})`.mapWith(Number),
      categories: sql`(select count(*) from ${schema.categories})`.mapWith(Number),
      shops: sql`(select count(*) from ${schema.shops})`.mapWith(Number),
      brandsAll: sql`(select count(*) from ${schema.brands})`.mapWith(Number),
      brandsStocked: sql`(select count(distinct b.id) from ${schema.brands} b
        join ${schema.products} p on p.brand_id = b.id)`.mapWith(Number),
      reviewsPublished: sql`(select count(*) from reviews where status = 'published' and seeded = false)`.mapWith(Number),
      reviewsSeeded: sql`(select count(*) from reviews where status = 'published' and seeded = true)`.mapWith(Number),
    }).from(sql`(select 1) as t`),
  ]);

  const core = 6;
  const learnCount = 1 + learn.reads.length;
  const total =
    core + counts.categories + counts.products + counts.shops + counts.brandsStocked + learn.reads.length;

  const onLocalhost = SITE_URL.includes("localhost");
  const verification = process.env.GOOGLE_SITE_VERIFICATION || null;

  return (
    <>
      <h1 className="wp-title">Search</h1>
      <p className="wp-subtitle">
        What this site offers a crawler, and what it deliberately withholds.
      </p>

      {onLocalhost && (
        <div className="wp-notice is-error">
          <p style={{ margin: 0 }}>
            <strong>NEXT_PUBLIC_SITE_URL is {SITE_URL}.</strong> Every canonical URL and every
            sitemap entry is being written with that origin, so anything Google reads points at a
            machine it cannot reach. Set it to the live domain before submitting anything.
          </p>
        </div>
      )}

      <div className="wp-cards">
        <div className="wp-card"><strong>{total}</strong><span>Indexable URLs</span></div>
        <div className="wp-card"><strong>{counts.products}</strong><span>Product pages</span></div>
        <div className="wp-card"><strong>{counts.brandsStocked}</strong><span>Brand pages with stock</span></div>
        <div className="wp-card"><strong>{counts.brandsAll - counts.brandsStocked}</strong><span>Brands held back</span></div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Google Search Console</div>
        <div className="wp-box-body">
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <strong>Verify the site.</strong>{" "}
              {verification ? (
                <span className="wp-pill is-green">meta tag is live</span>
              ) : (
                <>
                  Add <code>GOOGLE_SITE_VERIFICATION</code> to your environment with the token from
                  Search Console&rsquo;s HTML tag method, and redeploy. The tag is rendered into
                  every page automatically. <span className="wp-pill is-amber">not set</span>
                </>
              )}
            </li>
            <li>
              <strong>Submit the sitemap.</strong> In Search Console &rarr; Sitemaps, enter{" "}
              <code>sitemap.xml</code>. It is generated from the database on every request, so it
              never goes stale and never needs resubmitting.
            </li>
            <li>
              <strong>Leave it alone.</strong> Indexing takes days to weeks. Resubmitting a sitemap
              or requesting the same URL repeatedly does not make it faster.
            </li>
          </ol>

          <p className="wp-help" style={{ marginBottom: 0, marginTop: 12 }}>
            Google removed its sitemap ping endpoint in 2023, so there is no &ldquo;notify
            Google&rdquo; button to add — submitting once in Search Console is the whole mechanism.
          </p>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Live files</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <tbody>
              <tr>
                <td style={{ width: 200 }}>Sitemap</td>
                <td><a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noreferrer">{SITE_URL}/sitemap.xml</a></td>
                <td className="wp-help">Regenerated hourly from the catalogue</td>
              </tr>
              <tr>
                <td>Robots</td>
                <td><a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noreferrer">{SITE_URL}/robots.txt</a></td>
                <td className="wp-help">Declares the sitemap, blocks admin, checkout and search</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">What is in the sitemap</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <tbody>
              <tr><td style={{ width: 260 }}>Core pages</td><td>{core}</td></tr>
              <tr><td>Category listings</td><td>{counts.categories}</td></tr>
              <tr><td>Product pages</td><td>{counts.products}</td></tr>
              <tr><td>Delivery services</td><td>{counts.shops}</td></tr>
              <tr><td>Brand pages (stocked only)</td><td>{counts.brandsStocked}</td></tr>
              <tr><td>Learn articles</td><td>{learn.reads.length}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Held back on purpose</div>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <tbody>
              <tr>
                <td style={{ width: 260 }}>
                  <strong>{counts.brandsAll - counts.brandsStocked}</strong> brands with no products
                </td>
                <td className="wp-help">
                  Noindex, and left out of the sitemap. Offering a crawler dozens of empty pages is a
                  reliable way to have the whole site treated as low value.{" "}
                  <Link href="/admin/products?view=out">Stock them</Link> and they appear on their own.
                </td>
              </tr>
              <tr>
                <td><code>/checkout</code></td>
                <td className="wp-help">
                  Transactional, and <code>/checkout/&lt;reference&gt;</code> carries somebody&rsquo;s
                  address and a payment destination.
                </td>
              </tr>
              <tr>
                <td><code>/admin</code></td>
                <td className="wp-help">Behind a login, and nothing here is for the public.</td>
              </tr>
              <tr>
                <td><code>/search</code></td>
                <td className="wp-help">
                  An unbounded query space — a crawl trap rather than content. Also noindex, because
                  a disallowed URL can still be indexed from an external link.
                </td>
              </tr>
              <tr>
                <td>Product ratings</td>
                <td className="wp-help">
                  {counts.reviewsPublished > 0 ? (
                    <>
                      <strong>{counts.reviewsPublished}</strong> genuine review
                      {counts.reviewsPublished === 1 ? " is" : "s are"} published, so AggregateRating
                      ships for the products carrying them.
                      {counts.reviewsSeeded > 0 && <> The {counts.reviewsSeeded} sample reviews are excluded.</>}
                    </>
                  ) : (
                    <>
                      No genuine reviews yet, so no AggregateRating is emitted. The{" "}
                      {counts.reviewsSeeded} sample reviews are excluded by design — publishing an
                      invented rating is what search engines penalise.
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="wp-box" style={{ marginTop: 16 }}>
        <div className="wp-box-head">Manual crawl list</div>
        <div className="wp-box-body">
          <p style={{ marginTop: 0 }}>
            <code>npm run seo:crawl</code> writes the <code>seocrawl/</code> folder: every indexable
            URL as plain text and as XML, split by section. A plain text list of URLs is itself a
            sitemap format Google accepts, so it can be submitted as-is.
          </p>
          <p className="wp-help" style={{ marginBottom: 0 }}>
            Worth doing for <code>core-pages.txt</code> in URL Inspection and leaving the other{" "}
            {total - core} to the sitemap. Requesting indexing is rate limited to a few URLs a day,
            so working through {total} by hand is not a realistic plan.
          </p>
        </div>
      </div>
    </>
  );
}
