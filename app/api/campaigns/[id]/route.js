import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

export async function GET(request, { params }) {
  try {
    const campaignId = Number((await params).id);

    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return Response.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    const emailLogs = await db
      .select()
      .from(schema.emailLog)
      .where(eq(schema.emailLog.providerId, `campaign-${campaignId}`))
      .orderBy(schema.emailLog.createdAt);

    return Response.json({
      success: true,
      campaign,
      emailLogs,
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
