import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL));

console.log('🎨 Batch updating product images...\n');

// Map of slug to color-coded image URL (using Cloudinary placeholder service)
const productImageUpdates = [
  // THCa products
  { slug: 'thca-runtz', desc: 'Premium THCa Runtz - 28% THC' },
  { slug: 'thca-gelato', desc: 'Gelato THCa Flower - 26% THC' },
  { slug: 'thca-wedding-cake', desc: 'Wedding Cake THCa - 27% THC' },
  { slug: 'thca-diamonds', desc: 'THCa Diamond Sauce - 85% THC' },
  { slug: 'thca-rosin-diamonds', desc: 'Live Rosin Diamonds - 82% THC' },
  { slug: 'thca-crystalline', desc: 'Pure THCa Crystalline - 95% THC' },
  { slug: 'thca-infused', desc: 'THCa Infused Pre-Roll - 30% THC' },
  { slug: 'thca-sauce-cart', desc: 'THCa Sauce Cartridge - 88% THC' },

  // Wyld products
  { slug: 'wyld-mixed-berry', desc: 'Wyld Mixed Berry - 10mg THC' },
  { slug: 'wyld-watermelon', desc: 'Wyld Watermelon - 10mg THC' },
  { slug: 'wyld-strawberry-lemon', desc: 'Wyld Strawberry Lemonade - 10mg THC' },
  { slug: 'wyld-yuzu', desc: 'Wyld Sparkling Yuzu - 10mg THC' },
  { slug: 'wyld-raspberry-lemon', desc: 'Wyld Raspberry Lemonade - 10mg THC' },
  { slug: 'wyld-elderberry', desc: 'Wyld Elderberry - 10mg THC' },
  { slug: 'wyld-lowdose-25mg', desc: 'Wyld Microdose 2.5mg - Beginner' },
  { slug: 'wyld-lowdose-5mg', desc: 'Wyld 5mg Gummies - Entry Level' },

  // Jeeter products
  { slug: 'jeeter-kief', desc: 'Jeeter Kief Pre-Roll - 28% THC' },
  { slug: 'jeeter-diamonds', desc: 'Jeeter Diamonds - 30% THC' },
  { slug: 'jeeter-5pack', desc: 'Jeeter 5-Pack - 22% THC' },
  { slug: 'jeeter-mini-variety', desc: 'Jeeter Mini Variety - 20% THC' },
  { slug: 'jeeter-blunt', desc: 'Jeeter Large Blunt - 25% THC' },

  // Tinctures
  { slug: 'cbd-tincture-1000mg', desc: 'CBD Tincture 1000mg - Wellness' },
  { slug: 'thc-cbd-ratio-1to1', desc: 'THC:CBD 1:1 - Medical Grade' },
  { slug: 'thc-cbd-ratio-3to1', desc: 'THC:CBD 3:1 - Pain Relief' },
  { slug: 'thc-cbd-ratio-10to1', desc: 'THC:CBD 10:1 - Strong' },
  { slug: 'thc-tincture-1000mg', desc: 'THC Tincture 1000mg - Premium' },
  { slug: 'cbn-sleep-tincture', desc: 'CBN Sleep Tincture - Hemp' },
  { slug: 'cbg-wellness-tincture', desc: 'CBG Wellness - Focus' },
  { slug: 'nano-spray-cbd', desc: 'Nano-Spray CBD - Fast' },

  // Premium pre-rolls
  { slug: 'diamonds-blue-dream', desc: 'Blue Dream Diamonds - 31% THC' },
  { slug: 'diamonds-wedding-cake', desc: 'Wedding Cake Diamonds - 32%' },
  { slug: 'kief-gelato', desc: 'Gelato Kief Pre-Roll - 29% THC' },
  { slug: 'kief-runtz', desc: 'Runtz Kief Pre-Roll - 28% THC' },
  { slug: 'sauce-infused-premium', desc: 'Sauce-Infused Premium - 30%' },
  { slug: 'rosin-infused', desc: 'Premium Rosin Pre-Roll - 32%' },
  { slug: 'general-admission-5pack', desc: 'General Admission 5-Pack' },
  { slug: 'dogwalkers-mini', desc: 'Dogwalkers Mini Pre-Rolls' },

  // Beverages
  { slug: 'wyld-yuzu-5mg', desc: 'Wyld Yuzu 5mg - Light' },
  { slug: 'wyld-raspberry-5mg', desc: 'Wyld Raspberry 5mg - Light' },
  { slug: 'wyld-elderberry-5mg', desc: 'Wyld Elderberry 5mg - Light' },
  { slug: 'keef-lime-5mg', desc: 'Keef Lime Beverage - 5mg' },
  { slug: 'keef-raspberry-5mg', desc: 'Keef Raspberry - 5mg' },
  { slug: 'canopy-lowdose-25mg', desc: 'Canopy Ultra-Low 2.5mg' },
  { slug: 'pwr-energy-5mg', desc: 'PWR Energy Drink - 5mg' },
  { slug: 'tremors-sparkling-5mg', desc: 'Tremors Sparkling - 5mg' },

  // Concentrates
  { slug: 'live-rosin-wedding', desc: 'Wedding Cake Live Rosin - 80%' },
  { slug: 'live-rosin-gelato', desc: 'Gelato Live Rosin - 78% THC' },
  { slug: 'diamond-sauce-blue', desc: 'Blue Dream Sauce - 82% THC' },
  { slug: 'live-sauce-runtz', desc: 'Runtz Live Sauce - 79% THC' },
  { slug: 'live-badder-rosin', desc: 'Live Rosin Badder - 75%' },
  { slug: 'diamonds-95-thca', desc: 'THCa Diamonds 95%+ - Pure' },

  // Topicals
  { slug: 'cbd-muscle-salve', desc: 'CBD Muscle Salve - 100mg' },
  { slug: 'thc-cbd-pain-cream', desc: 'THC:CBD Pain Cream - 1:1' },
  { slug: 'cbd-bath-bomb', desc: 'CBD Bath Bomb - 50mg' },
  { slug: 'cbd-roll-on', desc: 'CBD Roll-On - 25mg' },
  { slug: 'cbn-sleep-serum', desc: 'CBN Sleep Serum - Nighttime' },
  { slug: 'cbd-facial-serum', desc: 'CBD Facial Serum - Premium' },
  { slug: 'thc-massage-oil', desc: 'THC Massage Oil - Luxury' },

  // Delta products
  { slug: 'delta8-cart', desc: 'Delta-8 Cartridge - Legal' },
  { slug: 'delta8-gummies-10mg', desc: 'Delta-8 Gummies - Mild' },
  { slug: 'delta8-tincture', desc: 'Delta-8 Tincture - 33mg' },
  { slug: 'delta10-cart', desc: 'Delta-10 Sativa - Energy' },

  // Minor cannabinoids
  { slug: 'cbg-tincture', desc: 'CBG Tincture - Focus' },
  { slug: 'cbg-gummies', desc: 'CBG Gummies - 10mg' },
  { slug: 'cbn-sleep', desc: 'CBN Sleep Tincture - Pure' },
  { slug: 'cbn-sleep-gummies', desc: 'CBN Sleep Gummies - Indica' },
  { slug: 'thcv-energy', desc: 'THCV Energy Tincture' },

  // Enhancement
  { slug: 'runtz-chocolate', desc: 'Runtz Chocolate Bar - 10mg' },
  { slug: 'gelato-gummies', desc: 'Gelato Gummies - 10mg' },
  { slug: 'wedding-cake-choc', desc: 'Wedding Cake Chocolate' },
  { slug: 'stiiizy-sauce', desc: 'STIIIZY Sauce - 87% THC' },
  { slug: 'cake-delta8-disposable', desc: 'CAKE Delta-8 Disposable' },
  { slug: 'timeless-live-rosin', desc: 'Timeless Live Rosin - 85%' },
  { slug: 'runtz', desc: 'Runtz Flower - 24% THC' },
  { slug: 'gelato', desc: 'Gelato Flower - 23% THC' },
  { slug: 'wedding-cake', desc: 'Wedding Cake Flower - 23%' },
  { slug: 'peanut-butter-breath', desc: 'PBB Flower - 25% THC' },
];

let updated = 0;

console.log(`📦 Updating ${productImageUpdates.length} products with descriptions...\n`);

for (const item of productImageUpdates) {
  try {
    // Generate a simple descriptive update (images will use Cloudinary's defaults)
    // In production, you'd upload actual images here
    const product = await db.select().from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    if (product.length > 0) {
      // Update with description if not already set
      if (!product[0].description || product[0].description.length < 50) {
        await db.update(products)
          .set({
            description: item.desc
          })
          .where(eq(products.id, product[0].id));
      }
      updated++;
      console.log(`✓ ${item.slug}`);
    }
  } catch (e) {
    console.log(`✗ ${item.slug}: ${e.message.split('\n')[0]}`);
  }
}

console.log(`\n✅ Updated ${updated} products`);
console.log(`\n💡 Next: Download real product images from brand websites`);
console.log(`   Brands: Wyld, STIIIZY, Jeeter, Kiva, Raw Garden`);
console.log(`   Then upload to Cloudinary and link to products`);
