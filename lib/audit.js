import "server-only";
import { db, schema } from "@/db/client";

/* Record what an administrator did. Never throws: an audit write failing must
   not roll back the action the user actually asked for, but it must be visible,
   so a failure is logged to the server console rather than swallowed. */
export async function audit({ actor, action, entity, entityId, summary, severity = "info" }) {
  try {
    await db.insert(schema.auditLog).values({
      actor: actor || "unknown",
      action,
      entity,
      entityId: entityId != null ? String(entityId) : null,
      summary,
      severity,
    });
  } catch (err) {
    console.error("[audit] failed to record", action, entity, err?.message ?? err);
  }
}

/** Convenience for the destructive paths, which are the ones that matter. */
export const auditDestructive = (opts) => audit({ ...opts, severity: "danger" });
