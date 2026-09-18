import { isNotNull, eq, and } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { sendMail } from "@/lib/mail/send.js";

export async function POST(request) {
  try {
    // Get all discounted products
    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        priceCents: schema.products.priceCents,
        wasPriceCents: schema.products.wasPriceCents,
        weight: schema.products.weight,
        brandName: schema.brands.name,
      })
      .from(schema.products)
      .innerJoin(schema.brands, (b) => b.id === schema.products.brandId)
      .where(isNotNull(schema.products.wasPriceCents))
      .limit(20);

    if (!products.length) {
      return Response.json({
        success: false,
        error: "No discounted products found. Add discount prices first."
      }, { status: 400 });
    }

    // Get all subscribers
    const subscribers = await db
      .select({
        email: schema.subscribers.email,
        name: schema.subscribers.name
      })
      .from(schema.subscribers)
      .where(and(
        eq(schema.subscribers.status, "subscribed"),
        isNotNull(schema.subscribers.consentedAt)
      ));

    if (!subscribers.length) {
      return Response.json({
        success: false,
        error: "No active subscribers found."
      }, { status: 400 });
    }

    // Build product list for email
    const productsList = products
      .map((p) => {
        const originalPrice = p.wasPriceCents / 100;
        const currentPrice = p.priceCents / 100;
        const savings = originalPrice - currentPrice;
        const discountPercent = Math.round((savings / originalPrice) * 100);
        return `• ${p.brandName} ${p.name} (${p.weight})
  Was $${originalPrice.toFixed(2)} → NOW $${currentPrice.toFixed(2)}
  Save ${discountPercent}% ($${savings.toFixed(2)})`;
      })
      .join("\n\n");

    const emailTemplate = `🎉 FRIDAY DEALS ARE HERE! 🎉

We've got amazing discounts on your favorite cannabis products this Friday!

${productsList}

${products.length > 20 ? `\n... and more products on discount!\n` : ""}

Visit us now and save big: ${process.env.NEXTAUTH_URL || "https://weedmap.store"}

Limited time offers - Shop now!`;

    // Send to all subscribers
    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const subscriber of subscribers) {
      try {
        const idempotencyKey = `friday-deals-${new Date().toISOString().split("T")[0]}-${subscriber.email}`;

        const result = await sendMail({
          template: "friday-deals",
          to: subscriber.email,
          subject: "🎉 FRIDAY DEALS: Amazing Discounts on Premium Cannabis",
          text: emailTemplate,
          key: idempotencyKey,
        });

        if (result.sent) {
          sentCount++;
        } else {
          failedCount++;
          errors.push(`${subscriber.email}: ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        errors.push(`${subscriber.email}: ${error.message}`);
      }
    }

    // Create campaign record
    await db.insert(schema.campaigns).values({
      name: `Friday Deals - ${new Date().toLocaleDateString()}`,
      subject: "🎉 FRIDAY DEALS: Amazing Discounts on Premium Cannabis",
      body: emailTemplate,
      status: "sent",
      recipientCount: subscribers.length,
      sentCount: sentCount,
      failedCount: failedCount,
      sentAt: new Date(),
      createdBy: "admin-direct",
    });

    return Response.json({
      success: true,
      message: `✅ Sent to ${sentCount} subscribers!`,
      sentCount,
      failedCount,
      productCount: products.length,
      subscriberCount: subscribers.length,
      errors: errors.length > 0 ? errors : null,
    });

  } catch (error) {
    console.error("Error sending Friday Deals:", error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
