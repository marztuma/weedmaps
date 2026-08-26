import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";

export const dynamic = "force-dynamic";

const TONE = { info: "is-grey", danger: "is-red", money: "is-green" };

export default async function ActivityPage({ searchParams }) {
  const sp = await searchParams;
  const entity = typeof sp.entity === "string" ? sp.entity : "";

  const [rows, kinds] = await Promise.all([
    db.select().from(schema.auditLog)
      .where(entity ? eq(schema.auditLog.entity, entity) : undefined)
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(200),
    db.select({ entity: schema.auditLog.entity, n: sql`count(*)`.mapWith(Number) })
      .from(schema.auditLog).groupBy(schema.auditLog.entity),
  ]);

  return (
    <>
      <div className="wp-head">
        <h1 className="wp-title">Activity Log</h1>
        <span className="wp-subtitle">Who changed what, and when</span>
      </div>

      <div className="wp-notice">
        <p>
          Written by the system, not editable from here. Deletions, payment confirmations and
          wallet changes are recorded so a mistake can be traced to a person and a time.
        </p>
      </div>

      <ul className="wp-subsubsub">
        <li><Link href="/admin/activity" className={!entity ? "is-current" : ""}>All</Link></li>
        {kinds.map((k) => (
          <li key={k.entity}>
            <Link href={`/admin/activity?entity=${k.entity}`} className={entity === k.entity ? "is-current" : ""}>
              {k.entity.replace(/_/g, " ")} <span>({k.n})</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="wp-table-wrap">
        <table className="wp-table">
          <thead>
            <tr><th style={{ width: 160 }}>When</th><th style={{ width: 130 }}>Who</th><th style={{ width: 130 }}>Action</th><th>What</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center" }} className="wp-help">
                Nothing recorded yet.
              </td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="wp-help">{new Date(r.createdAt).toLocaleString("en-US")}</td>
                <td>{r.actor}</td>
                <td><span className={`wp-pill ${TONE[r.severity] ?? "is-grey"}`}>{r.action.replace(/_/g, " ")}</span></td>
                <td>{r.summary}<div className="wp-help">{r.entity}{r.entityId ? ` #${r.entityId}` : ""}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
