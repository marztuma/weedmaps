export const runtime = "nodejs";

import { updateLearnContent } from "@/lib/learn/content-updater";

/* Cron endpoint: Update Learn content every Saturday at 8 PM

   Vercel cron syntax: runs at specified time in UTC
   Triggered automatically—no manual invocation needed

   Set up: Add to vercel.json:
   {
     "crons": [{
       "path": "/api/cron/update-learn",
       "schedule": "0 20 * * 6"
     }]
   }

   Schedule explained:
   0    = minute 0
   20   = hour 20 (8 PM UTC)
   *    = any day of month
   *    = any month
   6    = Saturday (0=Sunday, 6=Saturday)

   For other times:
   - 9 PM UTC: "0 21 * * 6"
   - 10 PM UTC: "0 22 * * 6"
   - Adjust timezone in vercel.json dashboard if needed
*/

export async function GET(request) {
  // Verify the request is from Vercel's cron service
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await updateLearnContent();

    if (result.success) {
      return Response.json({
        success: true,
        message: "Learn content updated successfully",
        articlesAdded: result.articlesAdded,
        timestamp: result.timestamp || new Date().toISOString(),
      });
    } else {
      return Response.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Cron] Unhandled error in update-learn:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/* Manual trigger (for testing)
   Call: POST /api/cron/update-learn
   Header: Authorization: Bearer YOUR_CRON_SECRET
*/
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await updateLearnContent();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
