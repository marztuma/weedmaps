import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, categories } from '../db/schema.js';
import { count, desc } from 'drizzle-orm';

const n = neon(process.env.DATABASE_URL);
const db = drizzle(n);

console.log('🔍 Verifying products in database...\n');

// Count total products
const [totalResult] = await db.select({ total: count() }).from(products);
const total = totalResult.total;

console.log(`📊 Total products in database: ${total}`);

// Check specific new products
const newProducts = await db
  .select({
    id: products.id,
    name: products.name,
    slug: products.slug,
    thc: products.thc,
    description: products.description,
  })
  .from(products)
  .limit(5);

console.log(`\n✅ Sample products found:`);
newProducts.forEach((p) => {
  console.log(`  • ${p.name} (${p.thc}% THC)`);
  if (p.description) {
    console.log(`    ${p.description.substring(0, 80)}...`);
  }
});

console.log(`\n✨ Database verification complete!`);
console.log(`\nIf URLs still show "Nothing on this shelf":`);
console.log(`  1. Wait 2-3 minutes for Vercel rebuild to complete`);
console.log(`  2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)`);
console.log(`  3. Check Vercel deployment status at: https://vercel.com/dashboard`);
