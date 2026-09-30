import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { products, categories } from '../db/schema.js';

const db = drizzle(neon(process.env.DATABASE_URL));
const schema = { products, categories };

console.log('✨ ADD PRODUCT EFFECTS TO ALL 229 PRODUCTS\n');
console.log('='.repeat(60));

// Effects by category (high-converting, customer-focused)
const effectsByCategory = {
  flower: [
    'Relaxing', 'Uplifting', 'Creative', 'Energizing', 'Sleep-focused',
  ],
  vape: [
    'Quick-acting', 'Relaxing', 'Uplifting', 'Creative', 'Portable',
  ],
  edibles: [
    'Long-lasting', 'Discreet', 'Precise dosing', 'Relaxing', 'Sleep-focused',
  ],
  concentrates: [
    'Potent', 'Relaxing', 'Creative', 'Fast-acting', 'Potency-focused',
  ],
  'pre-rolls': [
    'Convenient', 'Relaxing', 'Quick-acting', 'Portable', 'Ready-to-use',
  ],
  beverages: [
    'Refreshing', 'Discreet', 'Precise dosing', 'Long-lasting', 'Social',
  ],
  wellness: [
    'Therapeutic', 'Wellness-focused', 'Non-intoxicating', 'Pain relief', 'Calming',
  ],
  gear: [],
  brands: [],
  genetics: [
    'Uplifting', 'Relaxing', 'Creative', 'Energizing', 'Balanced',
  ],
};

// Strain type to effects mapping (sativa/hybrid/indica)
const effectsByStrainType = {
  sativa: ['Uplifting', 'Energizing', 'Creative', 'Focus', 'Social'],
  hybrid: ['Relaxing', 'Uplifting', 'Balanced', 'Creative', 'Mood-boost'],
  indica: ['Relaxing', 'Sleep-focused', 'Calming', 'Body-focused', 'Stress-relief'],
};

// Map products to effects by category
console.log('\n1️⃣ FETCHING ALL PRODUCTS:\n');
try {
  const products = await db.select().from(schema.products);
  console.log(`  ✅ Fetched ${products.length} products`);

  let updatedCount = 0;
  let skippedCount = 0;

  console.log('\n2️⃣ ADDING EFFECTS TO PRODUCTS:\n');

  for (const product of products) {
    const category = product.categoryId ?
      (await db.select({ slug: schema.categories.slug })
        .from(schema.categories)
        .where(eq(schema.categories.id, product.categoryId))
        .then(r => r[0]?.slug)) :
      null;

    // Get effects from category and strain type
    let effects = [];

    if (category && effectsByCategory[category]) {
      // Add category effects
      effects = [...effectsByCategory[category]];

      // Add strain-specific effects (first 3)
      const strainEffects = effectsByStrainType[product.strainType] || [];
      effects = [...new Set([...effects, ...strainEffects.slice(0, 3)])];
    }

    // Ensure we have at least 3 effects
    if (effects.length === 0) {
      effects = ['Popular', 'Quality', 'Delivered'];
      skippedCount++;
    } else if (effects.length < 3) {
      effects = [...effects, 'Quality', 'Popular'].slice(0, 5);
    }

    // Update product
    if (effects.length > 0) {
      await db.update(schema.products)
        .set({ effects })
        .where(eq(schema.products.id, product.id));
      updatedCount++;

      if (updatedCount % 50 === 0) {
        console.log(`  ⏳ Processed ${updatedCount} products...`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ EFFECTS ADDED:\n');
  console.log(`  ✓ Updated: ${updatedCount} products`);
  console.log(`  ⚠️  Defaulted: ${skippedCount} products`);
  console.log(`  📊 Total effects added: ~${products.length * 3}-5 per product`);

  console.log('\n💡 EFFECTS ADDED:\n');
  console.log('  • Sativa products: Uplifting, Energizing, Creative');
  console.log('  • Hybrid products: Relaxing, Uplifting, Balanced');
  console.log('  • Indica products: Relaxing, Sleep-focused, Calming');
  console.log('  • Category-specific effects added');

  console.log('\n🎯 NEXT STEP:\n');
  console.log('  1. Update ProductCard component to display effects as tags');
  console.log('  2. Add effects filter to products page');
  console.log('  3. Customers can now see WHY to buy each product!');

  console.log('\n' + '='.repeat(60) + '\n');
} catch (e) {
  console.log(`  ❌ Error: ${e.message.split('\n')[0]}`);
  process.exit(1);
}
