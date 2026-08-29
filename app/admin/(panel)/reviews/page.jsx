import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import BulkForm, { SelectAllToggle, BulkCheckbox } from "@/components/admin/BulkForm";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { moderateReview, deleteReview, bulkReviewAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 40;

const VIEWS = [
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

const BULK_ACTIONS = [
  { value: "publish", label: "Publish" },
  { value: "reject", label: "Reject" },
  { value: "delete", label: "Delete permanently" },
];

const when = (d) =>
  new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

export default async function ReviewsAdmin({ searchParams }) {
  const sp = await searchParams;
  const status = VIEWS.some((v) => v.value === sp?.status) ? sp.status : "pending";
  const page = Math.max(1, Number.parseInt(sp?.page, 10) || 1);

  const [rows, counts] = await Promise.all([
    db
      .select({
        id: schema.reviews.id,
        rating: schema.reviews.rating,
        title: schema.reviews.title,
        body: schema.reviews.body,
        author: schema.reviews.authorHandle,
        location: schema.reviews.authorLocation,
        status: schema.reviews.status,
        seeded: schema.reviews.seeded,
        createdAt: schema.reviews.createdAt,
        productName: schema.products.name,
        productSlug: schema.products.slug,
        shopName: schema.shops.name,
        shopSlug: schema.shops.slug,
      })
      .from(schema.reviews)
      .leftJoin(schema.products, eq(schema.reviews.productId, schema.products.id))
      .leftJoin(schema.shops, eq(schema.reviews.shopId, schema.shops.id))
      .where(eq(schema.reviews.status, status))
      .orderBy(desc(schema.reviews.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db
      .select({ status: schema.reviews.status, n: sql`count(*)`.mapWith(Number) })
      .from(schema.reviews)
      .groupBy(schema.reviews.status),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const total = byStatus[status] ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <h1 className="wp-title">Reviews</h1>
      <Notice
        map={{
          done: ["is-success", "Review updated."],
          deleted: ["is-success", "Review deleted permanently."],
          bulk_done: ["is-success", "Selected reviews updated."],
          bulk_deleted: ["is-success", "Selected reviews deleted permanently."],
          bulk_none: ["is-warning", "Nothing was selected, so nothing happened."],
        }}
      />

      <ul className="wp-subsubsub">
        {VIEWS.map((v, i) => (
          <li key={v.value}>
            {i > 0 && " | "}
            <Link
              href={`/admin/reviews?status=${v.value}`}
              className={v.value === status ? "is-current" : ""}
              aria-current={v.value === status ? "page" : undefined}
            >
              {v.label} ({byStatus[v.value] ?? 0})
            </Link>
          </li>
        ))}
      </ul>

      {status === "pending" && (
        <p className="wp-help" style={{ margin: "8px 0 12px" }}>
          Nothing on this tab is visible on the site. Published is the only status a shopper sees.
        </p>
      )}

      <div>
        <BulkForm action={bulkReviewAction} actions={BULK_ACTIONS} itemLabel="review" total={rows.length}>
          <div className="wp-table-wrap">
            <table className="wp-table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}><SelectAllToggle label="Select all reviews" /></th>
                  <th style={{ width: 92 }}>Rating</th>
                  <th>Review</th>
                  <th style={{ width: 200 }}>On</th>
                  <th style={{ width: 150 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 24, textAlign: "center" }}>
                      No {status} reviews.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <BulkCheckbox id={r.id} label={`Select review by ${r.author}`} />
                    </td>
                    <td>
                      <span title={`${r.rating} out of 5`} style={{ whiteSpace: "nowrap", letterSpacing: 1 }}>
                        {"★".repeat(r.rating)}
                        <span className="wp-help" style={{ display: "inline" }}>
                          {"☆".repeat(5 - r.rating)}
                        </span>
                      </span>
                    </td>
                    <td>
                      {r.title && <div className="wp-row-title">{r.title}</div>}
                      {r.body ? (
                        <p style={{ margin: "4px 0" }}>
                          {r.body.length > 240 ? `${r.body.slice(0, 240)}…` : r.body}
                        </p>
                      ) : (
                        <p className="wp-help" style={{ margin: "4px 0" }}>
                          Rating only — no comment left.
                        </p>
                      )}
                      <div className="wp-help">
                        {r.author}
                        {r.location ? ` · ${r.location}` : ""} · {when(r.createdAt)}
                        {r.seeded && <span className="wp-pill is-amber" style={{ marginLeft: 6 }}>sample</span>}
                      </div>
                    </td>
                    <td>
                      {r.productName ? (
                        <Link href={`/product/${r.productSlug}`} target="_blank">{r.productName}</Link>
                      ) : r.shopName ? (
                        <Link href={`/delivery/${r.shopSlug}`} target="_blank">{r.shopName}</Link>
                      ) : (
                        <span className="wp-help">—</span>
                      )}
                    </td>
                    <td>
                      <div className="wp-row-actions" style={{ visibility: "visible" }}>
                        {r.status !== "published" && (
                          <span>
                            <button type="submit" form={`pub-${r.id}`} className="wp-btn-plain">Publish</button>
                          </span>
                        )}
                        {r.status !== "rejected" && (
                          <span>
                            <button type="submit" form={`rej-${r.id}`} className="wp-btn-plain">Reject</button>
                          </span>
                        )}
                        <span>
                          <ConfirmSubmit
                            className="wp-btn-plain is-danger"
                            form={`del-review-${r.id}`}
                            message="Delete this review permanently? This cannot be undone."
                          >
                            Delete
                          </ConfirmSubmit>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkForm>

        {/* Row forms live outside the bulk form — a form cannot nest another. */}
        {rows.map((r) => (
          <div key={r.id}>
            <form id={`pub-${r.id}`} action={moderateReview} hidden>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="decision" value="publish" />
            </form>
            <form id={`rej-${r.id}`} action={moderateReview} hidden>
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="decision" value="reject" />
            </form>
            <form id={`del-review-${r.id}`} action={deleteReview} hidden>
              <input type="hidden" name="id" value={r.id} />
            </form>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
          {page > 1 && <Link href={`/admin/reviews?status=${status}&page=${page - 1}`}>‹ Previous</Link>}
          <span className="wp-help">Page {page} of {pages} · {total} total</span>
          {page < pages && <Link href={`/admin/reviews?status=${status}&page=${page + 1}`}>Next ›</Link>}
        </nav>
      )}
    </>
  );
}
