import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, categories } from '../db/schema.js';

const n = neon(process.env.DATABASE_URL);
const db = drizzle(n);

// Get categories first
const allCats = await db.select({ id: categories.id, name: categories.name }).from(categories);
const catMap = Object.fromEntries(allCats.map(c => [c.name.toLowerCase(), c.id]));

console.log('📦 Adding 77 new products to database...\n');

const products_to_add = [
  // TIER 1 - THCa (8)
  { name: 'THCa Premium Flower - Runtz', category: 'flower', slug: 'thca-runtz', brandId: 4, shopId: 1 },
  { name: 'THCa Premium Flower - Gelato', category: 'flower', slug: 'thca-gelato', brandId: 4, shopId: 1 },
  { name: 'THCa Premium Flower - Wedding Cake', category: 'flower', slug: 'thca-wedding-cake', brandId: 4, shopId: 1 },
  { name: 'THCa Diamond Sauce', category: 'concentrates', slug: 'thca-diamonds', brandId: 3, shopId: 1 },
  { name: 'THCa Live Rosin Diamonds', category: 'concentrates', slug: 'thca-rosin-diamonds', brandId: 3, shopId: 1 },
  { name: 'THCa Crystalline (99%+)', category: 'concentrates', slug: 'thca-crystalline', brandId: 3, shopId: 1 },
  { name: 'THCa Pre-Rolls (Infused)', category: 'pre-rolls', slug: 'thca-infused', brandId: 1, shopId: 1 },
  { name: 'THCa Sauce Vape Cartridge', category: 'vape pens', slug: 'thca-sauce-cart', brandId: 2, shopId: 1 },

  // TIER 1 - Wyld (8)
  { name: 'Wyld Gummies - Mixed Berry', category: 'edibles', slug: 'wyld-mixed-berry', brandId: 4, shopId: 2 },
  { name: 'Wyld Gummies - Watermelon', category: 'edibles', slug: 'wyld-watermelon', brandId: 4, shopId: 2 },
  { name: 'Wyld Gummies - Strawberry Lemonade', category: 'edibles', slug: 'wyld-strawberry-lemon', brandId: 4, shopId: 2 },
  { name: 'Wyld THC Beverage - Sparkling Yuzu', category: 'beverages', slug: 'wyld-yuzu', brandId: 4, shopId: 2 },
  { name: 'Wyld THC Beverage - Raspberry Lemonade', category: 'beverages', slug: 'wyld-raspberry-lemon', brandId: 4, shopId: 2 },
  { name: 'Wyld THC Beverage - Elderberry', category: 'beverages', slug: 'wyld-elderberry', brandId: 4, shopId: 2 },
  { name: 'Wyld Low-Dose Gummies 2.5mg', category: 'edibles', slug: 'wyld-lowdose-25mg', brandId: 4, shopId: 2 },
  { name: 'Wyld Low-Dose Gummies 5mg', category: 'edibles', slug: 'wyld-lowdose-5mg', brandId: 4, shopId: 2 },

  // TIER 1 - Jeeter (5)
  { name: 'Jeeter Infused Pre-Roll - Kief Coated', category: 'pre-rolls', slug: 'jeeter-kief', brandId: 1, shopId: 3 },
  { name: 'Jeeter Infused Pre-Roll - Diamonds & Sauce', category: 'pre-rolls', slug: 'jeeter-diamonds', brandId: 1, shopId: 3 },
  { name: 'Jeeter Pre-Roll 5-Pack', category: 'pre-rolls', slug: 'jeeter-5pack', brandId: 1, shopId: 3 },
  { name: 'Jeeter Mini Pre-Roll - Variety Pack', category: 'pre-rolls', slug: 'jeeter-mini-variety', brandId: 1, shopId: 3 },
  { name: 'Jeeter Blunt - Large Format', category: 'pre-rolls', slug: 'jeeter-blunt', brandId: 1, shopId: 3 },

  // TIER 1 - Tinctures (8)
  { name: 'Full Spectrum CBD Tincture 1000mg', category: 'wellness', slug: 'cbd-tincture-1000mg', brandId: 5, shopId: 1 },
  { name: 'THC:CBD Ratio Tincture 1:1', category: 'wellness', slug: 'thc-cbd-ratio-1to1', brandId: 5, shopId: 1 },
  { name: 'THC:CBD Ratio Tincture 3:1', category: 'wellness', slug: 'thc-cbd-ratio-3to1', brandId: 5, shopId: 1 },
  { name: 'THC:CBD Ratio Tincture 10:1', category: 'wellness', slug: 'thc-cbd-ratio-10to1', brandId: 5, shopId: 1 },
  { name: 'Full Spectrum THC Tincture 1000mg', category: 'wellness', slug: 'thc-tincture-1000mg', brandId: 5, shopId: 1 },
  { name: 'CBN Sleep Tincture (Hemp)', category: 'wellness', slug: 'cbn-sleep-tincture', brandId: 5, shopId: 1 },
  { name: 'CBG Wellness Tincture (Hemp)', category: 'wellness', slug: 'cbg-wellness-tincture', brandId: 5, shopId: 1 },
  { name: 'Nano-Spray CBD Applicator', category: 'wellness', slug: 'nano-spray-cbd', brandId: 5, shopId: 1 },

  // TIER 2 - Infused Pre-Rolls (8)
  { name: 'Diamond-Dusted Pre-Roll - Blue Dream', category: 'pre-rolls', slug: 'diamonds-blue-dream', brandId: 3, shopId: 2 },
  { name: 'Diamond-Dusted Pre-Roll - Wedding Cake', category: 'pre-rolls', slug: 'diamonds-wedding-cake', brandId: 3, shopId: 2 },
  { name: 'Kief-Coated Pre-Roll - Gelato', category: 'pre-rolls', slug: 'kief-gelato', brandId: 1, shopId: 3 },
  { name: 'Kief-Coated Pre-Roll - Runtz', category: 'pre-rolls', slug: 'kief-runtz', brandId: 1, shopId: 3 },
  { name: 'Sauce-Infused Pre-Roll - Premium', category: 'pre-rolls', slug: 'sauce-infused-premium', brandId: 2, shopId: 4 },
  { name: 'Rosin-Infused Pre-Roll', category: 'pre-rolls', slug: 'rosin-infused', brandId: 2, shopId: 4 },
  { name: 'General Admission Kief-Coated 5-Pack', category: 'pre-rolls', slug: 'general-admission-5pack', brandId: 1, shopId: 5 },
  { name: 'Dogwalkers Infused Mini Pre-Rolls', category: 'pre-rolls', slug: 'dogwalkers-mini', brandId: 3, shopId: 5 },

  // TIER 2 - Beverages (8)
  { name: 'Wyld THC Beverage - Sparkling Yuzu 5mg', category: 'beverages', slug: 'wyld-yuzu-5mg', brandId: 4, shopId: 1 },
  { name: 'Wyld THC Beverage - Raspberry Lemonade 5mg', category: 'beverages', slug: 'wyld-raspberry-5mg', brandId: 4, shopId: 1 },
  { name: 'Wyld THC Beverage - Elderberry 5mg', category: 'beverages', slug: 'wyld-elderberry-5mg', brandId: 4, shopId: 1 },
  { name: 'Keef Brands THC Drink - Lime 5mg', category: 'beverages', slug: 'keef-lime-5mg', brandId: 3, shopId: 2 },
  { name: 'Keef Brands THC Drink - Raspberry 5mg', category: 'beverages', slug: 'keef-raspberry-5mg', brandId: 3, shopId: 2 },
  { name: 'Canopy Growth Cannabis Drink 2.5mg', category: 'beverages', slug: 'canopy-lowdose-25mg', brandId: 4, shopId: 3 },
  { name: 'PWR Drink THC Energy 5mg', category: 'beverages', slug: 'pwr-energy-5mg', brandId: 2, shopId: 3 },
  { name: 'Tremors THC Sparkling 5mg', category: 'beverages', slug: 'tremors-sparkling-5mg', brandId: 1, shopId: 4 },

  // TIER 2 - Concentrates (6)
  { name: 'Live Rosin Diamonds - Wedding Cake', category: 'concentrates', slug: 'live-rosin-wedding', brandId: 3, shopId: 1 },
  { name: 'Live Rosin Diamonds - Gelato', category: 'concentrates', slug: 'live-rosin-gelato', brandId: 3, shopId: 1 },
  { name: 'Diamond Sauce - Blue Dream', category: 'concentrates', slug: 'diamond-sauce-blue', brandId: 3, shopId: 2 },
  { name: 'Live Rosin Sauce - Runtz', category: 'concentrates', slug: 'live-sauce-runtz', brandId: 3, shopId: 2 },
  { name: 'Cold Cure Live Rosin Badder', category: 'concentrates', slug: 'live-badder-rosin', brandId: 3, shopId: 3 },
  { name: 'Premium Diamond Concentrate 95%+ THCa', category: 'concentrates', slug: 'diamonds-95-thca', brandId: 3, shopId: 3 },

  // TIER 3 - Topicals (7)
  { name: 'CBD Muscle Relief Salve', category: 'wellness', slug: 'cbd-muscle-salve', brandId: 5, shopId: 1 },
  { name: 'THC:CBD Pain Cream 1:1', category: 'wellness', slug: 'thc-cbd-pain-cream', brandId: 5, shopId: 2 },
  { name: 'Premium CBD Bath Bomb', category: 'wellness', slug: 'cbd-bath-bomb', brandId: 5, shopId: 2 },
  { name: 'CBD Roll-On Pain Relief', category: 'wellness', slug: 'cbd-roll-on', brandId: 5, shopId: 3 },
  { name: 'CBN Sleep Topical Serum', category: 'wellness', slug: 'cbn-sleep-serum', brandId: 5, shopId: 3 },
  { name: 'CBD Facial Serum (Artisanal)', category: 'wellness', slug: 'cbd-facial-serum', brandId: 5, shopId: 4 },
  { name: 'THC Massage Oil', category: 'wellness', slug: 'thc-massage-oil', brandId: 5, shopId: 4 },

  // TIER 3 - Delta-8/10 (4)
  { name: 'Delta-8 THC Cartridge', category: 'vape pens', slug: 'delta8-cart', brandId: 2, shopId: 1 },
  { name: 'Delta-8 Gummies 10mg', category: 'edibles', slug: 'delta8-gummies-10mg', brandId: 4, shopId: 2 },
  { name: 'Delta-8 Tincture 1000mg', category: 'wellness', slug: 'delta8-tincture', brandId: 5, shopId: 3 },
  { name: 'Delta-10 THC Cartridge', category: 'vape pens', slug: 'delta10-cart', brandId: 2, shopId: 4 },

  // TIER 3 - Minor Cannabinoids (5)
  { name: 'CBG Wellness Tincture', category: 'wellness', slug: 'cbg-tincture', brandId: 5, shopId: 1 },
  { name: 'CBG Gummies 10mg', category: 'edibles', slug: 'cbg-gummies', brandId: 4, shopId: 2 },
  { name: 'CBN Sleep Tincture', category: 'wellness', slug: 'cbn-sleep', brandId: 5, shopId: 3 },
  { name: 'CBN Sleep Gummies', category: 'edibles', slug: 'cbn-sleep-gummies', brandId: 4, shopId: 3 },
  { name: 'THCV Energy Tincture', category: 'wellness', slug: 'thcv-energy', brandId: 5, shopId: 4 },

  // Enhancement (10)
  { name: 'Runtz Chocolate Bar', category: 'edibles', slug: 'runtz-chocolate', brandId: 4, shopId: 1 },
  { name: 'Gelato Gummy Edibles', category: 'edibles', slug: 'gelato-gummies', brandId: 4, shopId: 2 },
  { name: 'Wedding Cake Chocolate', category: 'edibles', slug: 'wedding-cake-choc', brandId: 1, shopId: 3 },
  { name: 'STIIIZY Sauce Cartridge', category: 'vape pens', slug: 'stiiizy-sauce', brandId: 2, shopId: 1 },
  { name: 'CAKE Delta-8 Disposable', category: 'vape pens', slug: 'cake-delta8-disposable', brandId: 2, shopId: 2 },
  { name: 'Timeless Live Rosin Cart', category: 'vape pens', slug: 'timeless-live-rosin', brandId: 3, shopId: 3 },
  { name: 'Runtz Flower', category: 'flower', slug: 'runtz', brandId: 4, shopId: 1 },
  { name: 'Gelato Flower', category: 'flower', slug: 'gelato', brandId: 4, shopId: 2 },
  { name: 'Wedding Cake Flower', category: 'flower', slug: 'wedding-cake', brandId: 1, shopId: 3 },
  { name: 'Peanut Butter Breath Flower', category: 'flower', slug: 'peanut-butter-breath', brandId: 3, shopId: 4 },
];

let added = 0;
const addedUrls = [];

for (const prod of products_to_add) {
  try {
    const catId = catMap[prod.category.toLowerCase()];
    if (!catId) {
      console.log(`⚠️  ${prod.name}: Category not found`);
      continue;
    }

    await db.insert(products).values({
      slug: prod.slug,
      name: prod.name,
      brandId: prod.brandId,
      categoryId: catId,
      shopId: prod.shopId,
      strainType: 'hybrid',
      weight: '1g',
      thc: 20,
      cbd: 2,
      priceCents: 2500,
      distanceMi: 2.5,
    });

    const url = `https://weedmap.store/shop/${prod.category.toLowerCase().replace(/\s+/g, '-')}/${prod.slug}`;
    addedUrls.push(url);
    added++;

    if (added % 10 === 0) {
      console.log(`✓ Added ${added}/${products_to_add.length}...`);
    }
  } catch (e) {
    console.log(`✗ ${prod.name}: ${e.message.split('\n')[0]}`);
  }
}

console.log(`\n✅ Successfully added: ${added} products`);
console.log(`\n📋 READY FOR GOOGLE SEARCH CONSOLE:\n`);
addedUrls.forEach(url => console.log(url));

console.log(`\n✨ ${added} product URLs ready!`);
