import { Resend } from "resend";
import { getAllDeals } from "@/db/queries";
import PromoEmail from "@/components/PromoEmail";
import { renderToString } from "react-dom/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    // Get all deals
    const deals = await getAllDeals();
    const topDeals = deals.slice(0, 6).map((d) => ({
      name: d.name,
      brand: d.brand,
      category: d.category,
      price: (d.price / 100).toFixed(2),
      originalPrice: d.wasPrice ? (d.wasPrice / 100).toFixed(2) : null,
    }));

    // Get subscriber emails (for now, using test email)
    // In production, you'd fetch from your subscribers database
    const subscriberEmails = process.env.TEST_SUBSCRIBER_EMAILS?.split(",") || [
      "test@example.com",
    ];

    // Render email template
    const emailHtml = renderToString(
      <PromoEmail deals={topDeals} offerCount={deals.length} />
    );

    // Send email to each subscriber
    const results = [];
    for (const email of subscriberEmails) {
      try {
        const result = await resend.emails.send({
          from: "Weedmaps Offers <offers@weedmap.store>",
          to: email,
          subject: `🎉 This Week's Hot Deals - ${topDeals.length} Offers Just For You`,
          html: emailHtml,
        });
        results.push({ email, success: true, id: result.data?.id });
      } catch (error) {
        results.push({ email, success: false, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Promotional email sent to ${results.filter((r) => r.success).length} subscribers`,
      results,
      dealCount: deals.length,
      topDeals: topDeals.slice(0, 3), // Return sample of deals
    });
  } catch (error) {
    console.error("Error sending promotional email:", error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to trigger email send (for testing)
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call POST handler
  return POST(request);
}
