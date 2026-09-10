export const runtime = "nodejs";

import { auditLearnContent } from "@/lib/learn/content-updater";

/* Status endpoint: Check Learn content health and update history

   View: GET /api/cron/learn-status
   Shows: Article count, freshness, last update time, content audit

   Use this to monitor if automated updates are working
*/

export async function GET() {
  try {
    const audit = await auditLearnContent();

    if (!audit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Could not read learn.json",
        }),
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      lastChecked: new Date().toISOString(),
      learnContentStatus: {
        totalArticles: audit.totalArticles,
        allArticlesComplete: audit.missingContent.length === 0,
        missingFieldCount: audit.missingContent.length,
        averageReadTime: Math.round(
          audit.articles.reduce((sum, a) => sum + a.readTime, 0) /
            audit.articles.length
        ),
        articles: audit.articles.map((a) => ({
          title: a.title,
          readTime: `${a.mins} min`,
          sections: a.sections,
          complete: a.hasAllFields,
        })),
      },
      nextScheduledUpdate: getNextSaturdayEveningUTC(),
      cronSchedule: "Every Saturday at 8 PM UTC (vercel.json)",
      setupInstructions: {
        step1: "Set CRON_SECRET environment variable in Vercel",
        step2: "Deploy to Vercel (vercel.json is required)",
        step3: "Check this endpoint to monitor updates",
      },
    });
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

function getNextSaturdayEveningUTC() {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = now.getUTCHours();

  let daysUntilSaturday;
  if (currentDay < 6) {
    // Mon-Fri: days until Saturday
    daysUntilSaturday = 6 - currentDay;
  } else if (currentDay === 6 && currentHour < 20) {
    // Saturday before 8 PM: today
    daysUntilSaturday = 0;
  } else {
    // Saturday after 8 PM: next Saturday
    daysUntilSaturday = 6;
  }

  const nextUpdate = new Date(now);
  nextUpdate.setUTCDate(nextUpdate.getUTCDate() + daysUntilSaturday);
  nextUpdate.setUTCHours(20, 0, 0, 0);

  return nextUpdate.toISOString();
}
