#!/usr/bin/env node

import { config } from "dotenv";
import { Resend } from "resend";

config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);

// Sample deals data - in production, this would come from the database
const sampleDeals = [
  {
    name: "STIIIZY Live Resin Cart",
    brand: "STIIIZY",
    category: "vape",
    price: "35.00",
    originalPrice: "50.00",
    savings: "30%",
  },
  {
    name: "Gelato Flower Eighth",
    brand: "Gelato",
    category: "flower",
    price: "28.00",
    originalPrice: "40.00",
    savings: "30%",
  },
  {
    name: "Medicated Gummies Bundle",
    brand: "Edipure",
    category: "edibles",
    price: "15.00",
    originalPrice: "25.00",
    savings: "40%",
  },
  {
    name: "Premium Concentrates",
    brand: "Concentrate Co",
    category: "concentrates",
    price: "45.00",
    originalPrice: "65.00",
    savings: "31%",
  },
  {
    name: "Pre-Roll Pack",
    brand: "RAW",
    category: "pre-rolls",
    price: "20.00",
    originalPrice: "30.00",
    savings: "33%",
  },
  {
    name: "Wellness Tincture",
    brand: "Wellness Plus",
    category: "wellness",
    price: "35.00",
    originalPrice: "50.00",
    savings: "30%",
  },
];

const emailTemplate = (deals, offerCount) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🎉 This Week's Hot Deals - Weedmaps</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: #fff; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 2.5rem;">🎉 Weekly Deals</h1>
      <p style="margin: 0; font-size: 1rem; opacity: 0.9;">Fresh offers just for you</p>
    </div>

    <!-- Intro -->
    <div style="padding: 30px 20px; border-bottom: 1px solid #eee;">
      <p style="margin: 0 0 10px 0; font-size: 1.1rem; color: #1a1a1a;">Hey there! 👋</p>
      <p style="margin: 0; font-size: 1rem; color: #666; line-height: 1.6;">
        We've found <strong>${offerCount} amazing deals</strong> on your favorite products this week.
        Delivery services are offering incredible discounts on everything from flower to edibles.
        Check them out before they're gone!
      </p>
    </div>

    <!-- Deals Grid -->
    <div style="padding: 30px 20px;">
      <h2 style="margin: 0 0 20px 0; font-size: 1.3rem; color: #1a1a1a; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">
        Top Offers This Week
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        ${deals
          .slice(0, 6)
          .map(
            (deal) => `
          <div style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; background-color: #fafafa; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 8px;">
              ${
                deal.category === "flower"
                  ? "🌿"
                  : deal.category === "edibles"
                    ? "🍬"
                    : deal.category === "vape"
                      ? "💨"
                      : deal.category === "concentrates"
                        ? "⚗️"
                        : "🎁"
              }
            </div>
            <p style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: bold; color: #1a1a1a;">
              ${deal.name}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #666;">
              ${deal.brand}
            </p>
            <p style="margin: 0 0 8px 0; font-size: 1.2rem; font-weight: bold; color: #ff6b35;">
              $${deal.price}
              ${deal.originalPrice ? `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-left: 8px;">$${deal.originalPrice}</span>` : ""}
            </p>
            <p style="margin: 0; font-size: 0.8rem; color: #27ae60; font-weight: bold;">
              Save ${deal.savings}!
            </p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>

    <!-- CTA Section -->
    <div style="padding: 30px 20px; background-color: #f9f9f9; border-top: 1px solid #eee; text-align: center;">
      <a href="https://weedmap.store/deals" style="display: inline-block; background-color: #ff6b35; color: #fff; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 1rem; margin-bottom: 15px;">
        🛍️ Shop All Deals
      </a>
      <p style="margin: 0 0 10px 0; font-size: 0.9rem; color: #666;">
        Limited time offers - Don't miss out!
      </p>
      <p style="margin: 0; font-size: 0.85rem; color: #999;">
        Offers available while supplies last at participating delivery services
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px; background-color: #1a1a1a; color: #fff; text-align: center; font-size: 0.85rem;">
      <p style="margin: 0 0 8px 0;">© 2026 Weedmaps. All rights reserved.</p>
      <p style="margin: 0 0 8px 0; opacity: 0.8;">You're receiving this because you subscribed to our newsletter.</p>
      <p style="margin: 0; opacity: 0.8;">
        <a href="https://weedmap.store/unsubscribe" style="color: #ff6b35; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

async function sendPromoEmail() {
  console.log("📧 Starting promotional email send...\n");

  // In production, get real subscriber emails from database
  const subscriberEmails = process.env.TEST_SUBSCRIBER_EMAILS?.split(",") || [
    "test@weedmaps.store",
  ];

  console.log(`📬 Sending to ${subscriberEmails.length} subscriber(s)...\n`);

  const results = [];

  for (const email of subscriberEmails) {
    try {
      console.log(`Sending to: ${email}...`);

      const result = await resend.emails.send({
        from: "Weedmaps Offers <offers@weedmaps.store>",
        to: email,
        subject: `🎉 This Week's Hot Deals - ${sampleDeals.length} Offers Just For You!`,
        html: emailTemplate(sampleDeals, sampleDeals.length),
      });

      if (result.error) {
        console.log(`❌ Failed: ${result.error.message}`);
        results.push({ email, success: false, error: result.error.message });
      } else {
        console.log(`✅ Sent successfully (ID: ${result.data.id})`);
        results.push({ email, success: true, id: result.data.id });
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      results.push({ email, success: false, error: error.message });
    }
  }

  console.log("\n📊 Summary:");
  console.log(`Total subscribers: ${subscriberEmails.length}`);
  console.log(`Successfully sent: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);
  console.log(`\nDeals included: ${sampleDeals.length}`);

  if (results.some((r) => !r.success)) {
    console.log("\n⚠️ Some emails failed to send:");
    results.filter((r) => !r.success).forEach((r) => {
      console.log(`  - ${r.email}: ${r.error}`);
    });
  }

  console.log("\n✨ Promotional email campaign complete!");
}

// Run the function
sendPromoEmail().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
