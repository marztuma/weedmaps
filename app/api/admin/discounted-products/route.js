import { isNotNull, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

export async function GET(request) {
  try {
    // Fetch all products with a discount (wasPriceCents is set)
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
        categoryName: schema.categories.name,
      })
      .from(schema.products)
      .leftJoin(schema.brands, eq(schema.brands.id, schema.products.brandId))
      .leftJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
      .where(isNotNull(schema.products.wasPriceCents))
      .orderBy(schema.products.createdAt);

    // Format with discount calculations
    const formatted = products.map((p) => {
      const originalPrice = p.wasPriceCents / 100;
      const currentPrice = p.priceCents / 100;
      const savings = originalPrice - currentPrice;
      const discountPercent = Math.round((savings / originalPrice) * 100);

      return {
        ...p,
        originalPrice,
        currentPrice,
        savings,
        discountPercent,
      };
    });

    return Response.json({ success: true, products: formatted, count: formatted.length });
  } catch (error) {
    console.error("Error fetching discounted products:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
