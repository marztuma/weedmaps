import Link from "next/link";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { saveCustomer, deleteCustomer, bulkCustomerAction } from "../../actions";
import Notice from "@/components/admin/Notice";
import SimpleEditor from "@/components/admin/SimpleEditor";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import BulkForm, { SelectAllToggle, BulkCheckbox } from "@/components/admin/BulkForm";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;

const { customers, orders } = schema;
const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;

export const STAGES = [
  { value: "lead", label: "Lead", tone: "is-grey" },
  { value: "first_order", label: "First order", tone: "is-blue" },
  { value: "repeat", label: "Repeat", tone: "is-green" },
  { value: "vip", label: "VIP", tone: "is-amber" },
  { value: "lapsed", label: "Lapsed", tone: "is-red" },
];
const stageMeta = (v) => STAGES.find((s) => s.value === v) ?? STAGES[0];

const BULK_ACTIONS = [
  { value: "delete", label: "Delete permanently", danger: true,
    confirm: "Delete {n}?\n\nTheir orders and notes are deleted too. This cannot be undone." },
  { value: "verify", label: "Mark age verified (21+)" },
  { value: "unverify", label: "Clear age verification" },
  ...STAGES.map((s) => ({ value: `stage:${s.value}`, label: `Move to ${s.label}` })),
];

export default async function CustomersAdmin({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const stage = typeof sp.stage === "string" ? sp.stage : "";
  const editId = Number(sp.edit) || null;
  const page = Math.max(1, Number(sp.paged) || 1);
  const adding = sp.new != null;

  const where = [];
  if (q) where.push(sql`(${customers.name} ilike ${"%" + q + "%"} or ${customers.email} ilike ${"%" + q + "%"})`);
  if (stage) where.push(eq(customers.stage, stage));
  const clause = where.length ? and(...where) : undefined;

  const [rows, [{ matching }], stageCounts, editing, [{ total }]] = await Promise.all([
    db.select({
      id: customers.id, name: customers.name, email: customers.email,
      phone: customers.phone, city: customers.city, stage: customers.stage,
      tags: customers.tags, ageVerified: customers.ageVerified,
      marketingOptIn: customers.marketingOptIn, createdAt: customers.createdAt,
      orderCount: sql`count(${orders.id})`.mapWith(Number),
      spend: sql`coalesce(sum(${orders.totalCents}) filter (where ${orders.status} <> 'cancelled'), 0)`.mapWith(Number),
    }).from(customers)
      .leftJoin(orders, eq(orders.customerId, customers.id))
      .where(clause)
      .groupBy(customers.id)
      .orderBy(desc(sql`coalesce(sum(${orders.totalCents}), 0)`), asc(customers.name))
      .limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    // Filtered count for the pager. `total` below stays unfiltered — it is the
    // "All (N)" figure in the view tabs and means something different.
    db.select({ matching: sql`count(*)`.mapWith(Number) }).from(customers).where(clause),
    db.select({ stage: customers.stage, n: sql`count(*)`.mapWith(Number) })
      .from(customers).groupBy(customers.stage),
    editId
      ? db.select().from(customers).where(eq(customers.id, editId)).limit(1).then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db.select({ total: sql`count(*)`.mapWith(Number) }).from(customers),
  ]);

  const countFor = (v) => stageCounts.find((s) => s.stage === v)?.n ?? 0;
  const editingRecord = editing && { ...editing, tags: (editing.tags ?? []).join(", ") };
  const showEditor = Boolean(editingRecord) || adding;

  const pages = Math.max(1, Math.ceil(matching / PER_PAGE));
  const pageQs = (n) => {
    const p = new URLSearchParams();
    if (stage) p.set("stage", stage);
    if (n > 1) p.set("paged", String(n));
    const q = p.toString();
    return q ? `?${q}` : "";
  };

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Customers</h1>
        {!showEditor && <Link href="/admin/customers?new=1" className="wp-btn">Add New</Link>}
        <a href="/admin/export?kind=customers" className="wp-btn">Export CSV</a>
        <span className="wp-subtitle">CRM · {total} total</span>
      </div>

      <Notice
        map={{
          deleted: ["is-success", "Customer deleted."],
          bulk_deleted: ["is-success", "Selected customers deleted, along with their orders and notes."],
          bulk_staged: ["is-success", "Selected customers moved to a new stage."],
          bulk_verified: ["is-success", "Age verification updated on the selected customers."],
          bulk_none: ["is-warning", "Nothing happened — pick an action and tick at least one row."],
        }}
      />

      <ul className="wp-subsubsub">
        <li><Link href="/admin/customers" className={!stage ? "is-current" : ""}>All <span>({total})</span></Link></li>
        {STAGES.map((s) => (
          <li key={s.value}>
            <Link href={`/admin/customers?stage=${s.value}`} className={stage === s.value ? "is-current" : ""}>
              {s.label} <span>({countFor(s.value)})</span>
            </Link>
          </li>
        ))}
      </ul>

      <form method="get" className="wp-tablenav">
        {stage && <input type="hidden" name="stage" value={stage} />}
        <span />
        <div style={{ display: "flex", gap: 6 }}>
          <input name="q" defaultValue={q} className="wp-input" placeholder="Search name or email" style={{ width: 240 }} />
          <button type="submit" className="wp-btn">Search Customers</button>
        </div>
      </form>

      <div
        className="wp-grid"
        style={{
          gridTemplateColumns: showEditor ? "minmax(0,320px) minmax(0,1fr)" : "minmax(0,1fr)",
          alignItems: "start",
        }}
      >
        {showEditor && (
          <SimpleEditor
            action={saveCustomer}
            title={editingRecord ? "Edit Customer" : "Add New Customer"}
            record={editingRecord}
            submitLabel={editingRecord ? "Update Customer" : "Add Customer"}
            cancelHref="/admin/customers"
            fields={[
              { name: "name", label: "Name", required: true },
              { name: "email", label: "Email", required: true },
              { name: "phone", label: "Phone" },
              { name: "address", label: "Delivery address" },
              { name: "city", label: "Area" },
              { name: "stage", label: "Stage", type: "select", options: STAGES.map((s) => ({ value: s.value, label: s.label })) },
              { name: "tags", label: "Tags", help: "Comma separated" },
              { name: "ageVerified", label: "Age verified (21+)", type: "checkbox" },
              { name: "marketingOptIn", label: "Marketing opt-in", type: "checkbox" },
              { name: "notes", label: "Internal notes", type: "textarea" },
            ]}
          />
        )}

        <div>
          <BulkForm action={bulkCustomerAction} actions={BULK_ACTIONS} itemLabel="customer" total={rows.length}>
            <div className="wp-table-wrap">
              <table className="wp-table">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}><SelectAllToggle label="Select all customers" /></th>
                    <th>Customer</th><th>Stage</th><th>Tags</th>
                    <th className="col-num">Orders</th><th className="col-num">Spend</th><th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 24, textAlign: "center" }}>
                      No customers match. <Link href="/admin/customers">Clear filters</Link> or{" "}
                      <Link href="/admin/customers?new=1">add one</Link>.
                    </td></tr>
                  )}
                  {rows.map((c) => {
                    const meta = stageMeta(c.stage);
                    return (
                      <tr key={c.id}>
                        <td>
                          <BulkCheckbox id={c.id} label={`Select ${c.name}`} />
                        </td>
                        <td>
                          <Link href={`/admin/customers/${c.id}`} className="wp-row-title">{c.name}</Link>
                          <div className="wp-help">{c.email}{c.city ? ` · ${c.city}` : ""}</div>
                          {!c.ageVerified && <span className="wp-pill is-red">Age unverified</span>}
                          <div className="wp-row-actions">
                            <span><Link href={`/admin/customers/${c.id}`}>View</Link></span>
                            <span><Link href={`/admin/customers?edit=${c.id}`}>Edit</Link></span>
                          </div>
                        </td>
                        <td><span className={`wp-pill ${meta.tone}`}>{meta.label}</span></td>
                        <td style={{ maxWidth: 240 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {(c.tags ?? []).map((t) => <span key={t} className="wp-pill is-grey">{t}</span>)}
                          </div>
                        </td>
                        <td className="col-num">{c.orderCount}</td>
                        <td className="col-num">{money(c.spend)}</td>
                        <td style={{ width: 80 }}>
                          <ConfirmSubmit
                            className="wp-btn-plain is-danger"
                            form={`del-customer-${c.id}`}
                            message={`Delete ${c.name}? Their ${c.orderCount} order(s) and notes go with them.`}
                          >
                            Delete
                          </ConfirmSubmit>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </BulkForm>

          {pages > 1 && (
            <div className="wp-tablenav">
              <span className="wp-subtitle">
                Page {page} of {pages} · {matching} customer{matching === 1 ? "" : "s"}
              </span>
              <div className="wp-tablenav-links">
                {page > 1 && <Link className="wp-btn" href={`/admin/customers${pageQs(page - 1)}`}>‹ Previous</Link>}
                {page < pages && <Link className="wp-btn" href={`/admin/customers${pageQs(page + 1)}`}>Next ›</Link>}
              </div>
            </div>
          )}

          {/* Row deletes live outside the bulk form — a form cannot nest another. */}
          {rows.map((c) => (
            <form key={c.id} id={`del-customer-${c.id}`} action={deleteCustomer} hidden>
              <input type="hidden" name="id" value={c.id} />
            </form>
          ))}
        </div>
      </div>
    </>
  );
}
