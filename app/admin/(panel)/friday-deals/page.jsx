import Link from "next/link";
import { desc, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db/client";
import Notice from "@/components/admin/Notice";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { sendFridayDeals } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function FridayDeals({ searchParams }) {
  const sp = await searchParams;

  // Fetch all products with discounts
  const products = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      priceCents: schema.products.priceCents,
      wasPriceCents: schema.products.wasPriceCents,
      weight: schema.products.weight,
      thc: schema.products.thc,
      strainType: schema.products.strainType,
      brandName: schema.brands.name,
    })
    .from(schema.products)
    .innerJoin(schema.brands, (b) => b.id === schema.products.brandId)
    .where(isNotNull(schema.products.wasPriceCents))
    .orderBy(desc(schema.products.createdAt));

  // Format products with discount info
  const formattedProducts = products.map((p) => {
    const originalPrice = p.wasPriceCents / 100;
    const currentPrice = p.priceCents / 100;
    const savings = originalPrice - currentPrice;
    const discountPercent = Math.round((savings / originalPrice) * 100);
    return { ...p, originalPrice, currentPrice, savings, discountPercent };
  });

  return (
    <>
      <h1 className="wp-title">🎉 Friday Deals</h1>
      <Notice
        map={{
          sent: ["is-success", "Friday Deals email sent successfully to all subscribers!"],
          no_products: ["is-warning", "No discounted products available to send."],
          no_recipients: ["is-warning", "No active subscribers to send to."],
          not_configured: ["is-warning", "Email is not configured."],
          invalid: ["is-error", "Campaign data is invalid."],
          error: ["is-error", "Error sending Friday Deals email."],
        }}
      />

      <div className="wp-box" style={{ marginBottom: 24 }}>
        <div className="wp-box-head">
          {formattedProducts.length} Discounted Products Ready to Send
        </div>
        <div className="wp-box-body">
          {formattedProducts.length === 0 ? (
            <p style={{ color: "#666" }}>
              No products with discounts available. Add discount prices to products first.
            </p>
          ) : (
            <>
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                <strong>Ready to promote</strong> {formattedProducts.length} discounted product{formattedProducts.length !== 1 ? "s" : ""} to all subscribers via email.
              </p>

              <div style={{ maxHeight: 500, overflowY: "auto", marginBottom: 24 }}>
                <table className="wp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ width: 100 }}>Brand</th>
                      <th style={{ width: 80 }}>Was</th>
                      <th style={{ width: 80 }}>Now</th>
                      <th style={{ width: 80 }}>Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedProducts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="wp-row-title">{p.name}</span>
                          <div className="wp-help">{p.weight} • {p.strainType}</div>
                        </td>
                        <td className="wp-help">{p.brandName}</td>
                        <td className="wp-help">${p.originalPrice.toFixed(2)}</td>
                        <td>
                          <strong>${p.currentPrice.toFixed(2)}</strong>
                        </td>
                        <td>
                          <strong style={{ color: "#27ae60" }}>
                            {p.discountPercent}% off
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="wp-form-row">
                <form id="send-deals" action={sendFridayDeals}>
                  <input type="hidden" name="productCount" value={formattedProducts.length} />
                  <ConfirmSubmit
                    className="wp-btn is-primary"
                    form="send-deals"
                    message={`Send Friday Deals email featuring ${formattedProducts.length} discounted products to all subscribers? This cannot be undone.`}
                  >
                    Send Friday Deals Email Now
                  </ConfirmSubmit>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="wp-subtitle">
        <Link href="/admin/products">Manage products</Link> to add or update discount prices.
      </p>
    </>
  );
}
