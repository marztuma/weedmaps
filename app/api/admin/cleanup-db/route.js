import { db, schema } from "@/db/client";
import { lt } from "drizzle-orm";

/**
 * AUTO-CLEANUP CRON JOB
 *
 * Runs monthly to archive old data and keep database lean
 * Call this via Vercel Cron: https://vercel.com/docs/cron-jobs
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/admin/cleanup-db",
 *     "schedule": "0 2 1 * *"  // 2 AM on 1st of each month
 *   }]
 * }
 */

export async function GET(request) {
  // Verify this is a Cron request from Vercel
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

    console.log("🗑️ Starting database cleanup...");

    // 1. Archive page views older than 3 months
    const pageViewsDeleted = await db
      .delete(schema.pageViews)
      .where(lt(schema.pageViews.viewedAt, threeMonthsAgo));

    // 2. Archive admin notifications older than 3 months
    const notificationsDeleted = await db
      .delete(schema.adminNotifications)
      .where(
        lt(schema.adminNotifications.createdAt, threeMonthsAgo)
      );

    // 3. Archive audit logs older than 2 years
    const auditLogsDeleted = await db
      .delete(schema.auditLog)
      .where(lt(schema.auditLog.createdAt, twoYearsAgo));

    // 4. Archive email events older than 3 months
    const emailEventsDeleted = await db
      .delete(schema.emailEvents)
      .where(lt(schema.emailEvents.receivedAt, threeMonthsAgo));

    // 5. Archive old email logs (6+ months)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const emailLogsDeleted = await db
      .delete(schema.emailLog)
      .where(lt(schema.emailLog.createdAt, sixMonthsAgo));

    const result = {
      success: true,
      message: "Database cleanup completed",
      deleted: {
        pageViews: pageViewsDeleted.rowCount || 0,
        notifications: notificationsDeleted.rowCount || 0,
        auditLogs: auditLogsDeleted.rowCount || 0,
        emailEvents: emailEventsDeleted.rowCount || 0,
        emailLogs: emailLogsDeleted.rowCount || 0,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Cleanup completed:", result);

    return Response.json(result);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
