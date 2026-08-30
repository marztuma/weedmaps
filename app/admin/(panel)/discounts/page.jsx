import Link from "next/link";
import { desc, sql, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { saveDiscountCode, deleteDiscountCode, toggleDiscountCode } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const money = (c) => `$${((c ?? 0) / 100).toFixed(2)}`;
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

export default async function Discounts({ searchParams }) {
  const sp = await searchParams;
  const editId = Number(sp?.edit) || null;

  const [rows, editing] = await Promise.all([
    db.select({
      id: schema.discountCodes.id,
      code: schema.discountCodes.code,
      description: schema.discountCodes.description,
      kind: schema.discountCodes.kind,
      value: schema.discountCodes.value,
      minSubtotalCents: schema.discountCodes.minSubtotalCents,
      maxDiscountCents: schema.discountCodes.maxDiscountCents,
      usageLimit: schema.discountCodes.usageLimit,
      perCustomerLimit: schema.discountCodes.perCustomerLimit,
      startsAt: schema.discountCodes.startsAt,
      endsAt: schema.discountCodes.endsAt,
      active: schema.discountCodes.active,
      used: sql`(select count(*) from discount_redemptions r where r.code_id = ${schema.discountCodes.id})`.mapWith(Number),
      saved: sql`(select coalesce(sum(r.amount_cents),0) from discount_redemptions r where r.code_id = ${schema.discountCodes.id})`.mapWith(Number),
    }).from(schema.discountCodes).orderBy(desc(schema.discountCodes.createdAt)),
    editId
      ? db.select().from(schema.discountCodes).where(eq(schema.discountCodes.id, editId)).limit(1).then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <>
      <h1 className="wp-title">Discount codes</h1>
      <Notice
        map={{
          saved: ["is-success", "Code saved."],
          deleted: ["is-success", "Code deleted."],
          toggled: ["is-success", "Code updated."],
          invalid: ["is-error", "That code could not be saved — check the value and the code itself."],
          duplicate: ["is-error", "A code with that name already exists."],
        }}
      />

      <div className="wp-box">
        <div className="wp-box-head">{editing ? `Edit ${editing.code}` : "New code"}</div>
        <div className="wp-box-body">
          <form action={saveDiscountCode}>
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div className="wp-form-row wp-form-row-3">
              <div className="wp-field">
                <label className="wp-label" htmlFor="code">Code</label>
                <input id="code" name="code" className="wp-input" required maxLength={32}
                  defaultValue={editing?.code ?? ""} placeholder="WELCOME10" />
                <p className="wp-help">Matched without case or spaces — people paste these out of emails.</p>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="kind">Type</label>
                <select id="kind" name="kind" className="wp-input" defaultValue={editing?.kind ?? "percent"}>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="value">Value</label>
                <input id="value" name="value" className="wp-input" inputMode="decimal" required
                  defaultValue={editing ? (editing.kind === "percent" ? editing.value : editing.value / 100) : ""} />
                <p className="wp-help">Percent as a number (10 = 10%), fixed in dollars.</p>
              </div>
            </div>

            <div className="wp-field">
              <label className="wp-label" htmlFor="description">Description</label>
              <input id="description" name="description" className="wp-input" maxLength={160}
                defaultValue={editing?.description ?? ""} placeholder="Welcome offer for new subscribers" />
            </div>

            <div className="wp-form-row wp-form-row-3">
              <div className="wp-field">
                <label className="wp-label" htmlFor="minSubtotal">Minimum subtotal</label>
                <input id="minSubtotal" name="minSubtotal" className="wp-input" inputMode="decimal"
                  defaultValue={editing ? editing.minSubtotalCents / 100 : 0} />
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="maxDiscount">Maximum discount</label>
                <input id="maxDiscount" name="maxDiscount" className="wp-input" inputMode="decimal"
                  defaultValue={editing?.maxDiscountCents != null ? editing.maxDiscountCents / 100 : ""} />
                <p className="wp-help">Blank for no ceiling. A percentage with no cap is a hole on a large basket.</p>
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="usageLimit">Total uses</label>
                <input id="usageLimit" name="usageLimit" className="wp-input" inputMode="numeric"
                  defaultValue={editing?.usageLimit ?? ""} />
                <p className="wp-help">Blank for unlimited.</p>
              </div>
            </div>

            <div className="wp-form-row wp-form-row-3">
              <div className="wp-field">
                <label className="wp-label" htmlFor="perCustomer">Uses per customer</label>
                <input id="perCustomer" name="perCustomer" className="wp-input" inputMode="numeric"
                  defaultValue={editing?.perCustomerLimit ?? 1} />
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="startsAt">Starts</label>
                <input id="startsAt" name="startsAt" type="date" className="wp-input"
                  defaultValue={editing?.startsAt ? new Date(editing.startsAt).toISOString().slice(0, 10) : ""} />
              </div>
              <div className="wp-field">
                <label className="wp-label" htmlFor="endsAt">Ends</label>
                <input id="endsAt" name="endsAt" type="date" className="wp-input"
                  defaultValue={editing?.endsAt ? new Date(editing.endsAt).toISOString().slice(0, 10) : ""} />
              </div>
            </div>

            <label className="wp-check">
              <input type="checkbox" name="active" defaultChecked={editing ? editing.active : true} />
              <span>Active</span>
            </label>

            <div style={{ marginTop: 12 }}>
              <button type="submit" className="wp-btn is-primary">{editing ? "Save code" : "Create code"}</button>
              {editing && <Link href="/admin/discounts" className="wp-btn" style={{ marginLeft: 8 }}>Cancel</Link>}
            </div>
          </form>
        </div>
      </div>

      <div className="wp-table-wrap" style={{ marginTop: 16 }}>
        <table className="wp-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>Code</th>
              <th>Description</th>
              <th style={{ width: 110 }}>Discount</th>
              <th style={{ width: 110 }}>Minimum</th>
              <th style={{ width: 110 }}>Used</th>
              <th style={{ width: 120 }}>Given away</th>
              <th style={{ width: 150 }}>Window</th>
              <th style={{ width: 150 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, textAlign: "center" }}>
                No codes yet. Create one above.
              </td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="wp-row-title">{c.code}</span>
                  {!c.active && <span className="wp-pill is-grey" style={{ marginLeft: 6 }}>off</span>}
                </td>
                <td className="wp-help">{c.description ?? "—"}</td>
                <td>{c.kind === "percent" ? `${c.value}%` : money(c.value)}</td>
                <td>{c.minSubtotalCents ? money(c.minSubtotalCents) : "—"}</td>
                <td>{c.used}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}</td>
                <td>{money(c.saved)}</td>
                <td className="wp-help">
                  {c.startsAt || c.endsAt ? `${when(c.startsAt)} → ${when(c.endsAt)}` : "always"}
                </td>
                <td>
                  <div className="wp-row-actions" style={{ visibility: "visible" }}>
                    <span><Link href={`/admin/discounts?edit=${c.id}`}>Edit</Link></span>
                    <span><button type="submit" form={`tog-${c.id}`} className="wp-btn-plain">{c.active ? "Turn off" : "Turn on"}</button></span>
                    <span>
                      <ConfirmSubmit className="wp-btn-plain is-danger" form={`del-code-${c.id}`}
                        message={`Delete ${c.code}? Its redemption history goes with it. Turning it off keeps the record.`}>
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

      {rows.map((c) => (
        <div key={c.id}>
          <form id={`tog-${c.id}`} action={toggleDiscountCode} hidden>
            <input type="hidden" name="id" value={c.id} />
          </form>
          <form id={`del-code-${c.id}`} action={deleteDiscountCode} hidden>
            <input type="hidden" name="id" value={c.id} />
          </form>
        </div>
      ))}
    </>
  );
}
