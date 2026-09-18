import { eq, and, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { sendMail } from "@/lib/mail/send.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return Response.json({ success: false, error: "No products provided" }, { status: 400 });
    }

    // Get all subscribed users with consent
    const subscribers = await db
      .select({ email: schema.subscribers.email })
      .from(schema.subscribers)
      .where(and(
        eq(schema.subscribers.status, "subscribed"),
        isNotNull(schema.subscribers.consentedAt)
      ));

    if (subscribers.length === 0) {
      return Response.json({ success: false, error: "No active subscribers" }, { status: 400 });
    }

    // Build email content
    const productsList = products
      .slice(0, 15) // Limit to top 15 products
      .map((p) => {
        const savings = p.originalPrice - p.currentPrice;
        return `• ${p.brandName} ${p.name} (${p.weight})
  Was $${p.originalPrice.toFixed(2)} → Now $${p.currentPrice.toFixed(2)}
  Save $${savings.toFixed(2)} (${p.discountPercent}% off)`;
      })
      .join("\n\n");

    const emailBody = `🎉 FRIDAY DEALS ARE HERE! 🎉

This Friday, we're featuring amazing discounts on your favorite products. Check out these hot deals:

${productsList}

${products.length > 15 ? `\n...and ${products.length - 15} more products on discount!\n` : ""}

Shop now and save big on premium cannabis products. Limited time offers!

Visit: ${process.env.NEXTAUTH_URL || "https://weedmap.store"}`;

    // Send to all subscribers
    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        const idempotencyKey = `friday-deals-${new Date().toISOString().split("T")[0]}-${subscriber.email}`;

        await sendMail({
          template: "friday-deals",
          to: subscriber.email,
          subject: "🎉 Friday Deals: Up to 40% Off Premium Cannabis",
          text: emailBody,
          key: idempotencyKey,
        });

        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        failedCount++;
      }
    }

    // Log the campaign
    await db.insert(schema.campaigns).values({
      name: `Friday Deals - ${new Date().toLocaleDateString()}`,
      subject: "🎉 Friday Deals: Up to 40% Off Premium Cannabis",
      body: emailBody,
      status: "sent",
      recipientCount: subscribers.length,
      sentCount: sentCount,
      failedCount: failedCount,
      sentAt: new Date(),
      createdBy: "system",
    });

    return Response.json({
      success: true,
      subscriberCount: sentCount,
      failedCount: failedCount,
      productCount: products.length,
    });
  } catch (error) {
    console.error("Error sending Friday Deals email:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
