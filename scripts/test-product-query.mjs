import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, brands, categories, shops } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const n = neon(process.env.DATABASE_URL);
const db = drizzle(n);

console.log('🔍 Testing product query...\n');

// Try to get a new product with full joins
try {
  const result = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      brandId: products.brandId,
      categoryId: products.categoryId,
      shopId: products.shopId,
      brandName: brands.name,
      categoryName: categories.name,
      shopName: shops.name,
    })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(shops, eq(products.shopId, shops.id))
    .where(eq(products.slug, 'thca-runtz'))
    .limit(1);

  if (result.length === 0) {
    console.log('❌ Product thca-runtz NOT found with full joins');

    // Try without joins to see if product exists
    const raw = await db.select().from(products).where(eq(products.slug, 'thca-runtz'));
    if (raw.length > 0) {
      console.log('\n⚠️  Product exists but JOIN is failing:');
      console.log(`   brandId: ${raw[0].brandId}`);
      console.log(`   categoryId: ${raw[0].categoryId}`);
      console.log(`   shopId: ${raw[0].shopId}`);

      // Check if these IDs exist in their tables
      const brand = await db.select().from(brands).where(eq(brands.id, raw[0].brandId));
      const cat = await db.select().from(categories).where(eq(categories.id, raw[0].categoryId));
      const shop = await db.select().from(shops).where(eq(shops.id, raw[0].shopId));

      console.log(`\n   ✓ Brand exists: ${brand.length > 0}`);
      console.log(`   ✓ Category exists: ${cat.length > 0}`);
      console.log(`   ✓ Shop exists: ${shop.length > 0}`);
    } else {
      console.log('❌ Product thca-runtz does NOT exist in database');
    }
  } else {
    console.log('✅ Product found! Details:');
    console.log(`   Name: ${result[0].name}`);
    console.log(`   Brand: ${result[0].brandName}`);
    console.log(`   Category: ${result[0].categoryName}`);
    console.log(`   Shop: ${result[0].shopName}`);
    console.log('\n✨ Product query is working correctly!');
  }
} catch (e) {
  console.log('❌ Query error:', e.message);
}
