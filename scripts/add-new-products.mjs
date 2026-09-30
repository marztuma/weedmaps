import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, categories } from '../db/schema.js';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Get all categories
const allCats = await db.select().from(categories);
const catMap = Object.fromEntries(allCats.map(c => [c.name.toLowerCase(), c.id]));

console.log('Available categories:', Object.keys(catMap).join(', '));

// Product data to insert: [name, category, brandId, slug]
const newProducts = [
  // TIER 1 - THCa Products
  ['THCa Premium Flower - Runtz', 'flower', null, 'thca-runtz'],
  ['THCa Premium Flower - Gelato', 'flower', null, 'thca-gelato'],
  ['THCa Premium Flower - Wedding Cake', 'flower', null, 'thca-wedding-cake'],
  ['THCa Diamond Sauce', 'concentrates', null, 'thca-diamonds'],
  ['THCa Live Rosin Diamonds', 'concentrates', null, 'thca-rosin-diamonds'],
  ['THCa Crystalline (99%+)', 'concentrates', null, 'thca-crystalline'],
  ['THCa Pre-Rolls (Infused)', 'pre-rolls', null, 'thca-infused'],
  ['THCa Sauce Vape Cartridge', 'vape pens', null, 'thca-sauce-cart'],

  // TIER 1 - Wyld Edibles & Beverages
  ['Wyld Gummies - Mixed Berry', 'edibles', null, 'wyld-mixed-berry'],
  ['Wyld Gummies - Watermelon', 'edibles', null, 'wyld-watermelon'],
  ['Wyld Gummies - Strawberry Lemonade', 'edibles', null, 'wyld-strawberry-lemon'],
  ['Wyld THC Beverage - Sparkling Yuzu', 'beverages', null, 'wyld-yuzu'],
  ['Wyld THC Beverage - Raspberry Lemonade', 'beverages', null, 'wyld-raspberry-lemon'],
  ['Wyld THC Beverage - Elderberry', 'beverages', null, 'wyld-elderberry'],
  ['Wyld Low-Dose Gummies 2.5mg', 'edibles', null, 'wyld-lowdose-25mg'],
  ['Wyld Low-Dose Gummies 5mg', 'edibles', null, 'wyld-lowdose-5mg'],

  // TIER 1 - Jeeter Pre-Rolls
  ['Jeeter Infused Pre-Roll - Kief Coated', 'pre-rolls', null, 'jeeter-kief'],
  ['Jeeter Infused Pre-Roll - Diamonds & Sauce', 'pre-rolls', null, 'jeeter-diamonds'],
  ['Jeeter Pre-Roll 5-Pack', 'pre-rolls', null, 'jeeter-5pack'],
  ['Jeeter Mini Pre-Roll - Variety Pack', 'pre-rolls', null, 'jeeter-mini-variety'],
  ['Jeeter Blunt - Large Format', 'pre-rolls', null, 'jeeter-blunt'],

  // TIER 1 - Tinctures
  ['Full Spectrum CBD Tincture 1000mg', 'wellness', null, 'cbd-tincture-1000mg'],
  ['THC:CBD Ratio Tincture 1:1', 'wellness', null, 'thc-cbd-ratio-1to1'],
  ['THC:CBD Ratio Tincture 3:1', 'wellness', null, 'thc-cbd-ratio-3to1'],
  ['THC:CBD Ratio Tincture 10:1', 'wellness', null, 'thc-cbd-ratio-10to1'],
  ['Full Spectrum THC Tincture 1000mg', 'wellness', null, 'thc-tincture-1000mg'],
  ['CBN Sleep Tincture (Hemp)', 'wellness', null, 'cbn-sleep-tincture'],
  ['CBG Wellness Tincture (Hemp)', 'wellness', null, 'cbg-wellness-tincture'],
  ['Nano-Spray CBD Applicator', 'wellness', null, 'nano-spray-cbd'],

  // TIER 2 - Infused Pre-Rolls
  ['Diamond-Dusted Pre-Roll - Blue Dream', 'pre-rolls', null, 'diamonds-blue-dream'],
  ['Diamond-Dusted Pre-Roll - Wedding Cake', 'pre-rolls', null, 'diamonds-wedding-cake'],
  ['Kief-Coated Pre-Roll - Gelato', 'pre-rolls', null, 'kief-gelato'],
  ['Kief-Coated Pre-Roll - Runtz', 'pre-rolls', null, 'kief-runtz'],
  ['Sauce-Infused Pre-Roll - Premium', 'pre-rolls', null, 'sauce-infused-premium'],
  ['Rosin-Infused Pre-Roll', 'pre-rolls', null, 'rosin-infused'],
  ['General Admission Kief-Coated 5-Pack', 'pre-rolls', null, 'general-admission-5pack'],
  ['Dogwalkers Infused Mini Pre-Rolls', 'pre-rolls', null, 'dogwalkers-mini'],

  // TIER 2 - Cannabis Beverages
  ['Wyld THC Beverage - Sparkling Yuzu 5mg', 'beverages', null, 'wyld-yuzu-5mg'],
  ['Wyld THC Beverage - Raspberry Lemonade 5mg', 'beverages', null, 'wyld-raspberry-5mg'],
  ['Wyld THC Beverage - Elderberry 5mg', 'beverages', null, 'wyld-elderberry-5mg'],
  ['Keef Brands THC Drink - Lime 5mg', 'beverages', null, 'keef-lime-5mg'],
  ['Keef Brands THC Drink - Raspberry 5mg', 'beverages', null, 'keef-raspberry-5mg'],
  ['Canopy Growth Cannabis Drink 2.5mg', 'beverages', null, 'canopy-lowdose-25mg'],
  ['PWR Drink THC Energy 5mg', 'beverages', null, 'pwr-energy-5mg'],
  ['Tremors THC Sparkling 5mg', 'beverages', null, 'tremors-sparkling-5mg'],

  // TIER 2 - Premium Concentrates
  ['Live Rosin Diamonds - Wedding Cake', 'concentrates', null, 'live-rosin-wedding'],
  ['Live Rosin Diamonds - Gelato', 'concentrates', null, 'live-rosin-gelato'],
  ['Diamond Sauce - Blue Dream', 'concentrates', null, 'diamond-sauce-blue'],
  ['Live Rosin Sauce - Runtz', 'concentrates', null, 'live-sauce-runtz'],
  ['Cold Cure Live Rosin Badder', 'concentrates', null, 'live-badder-rosin'],
  ['Premium Diamond Concentrate 95%+ THCa', 'concentrates', null, 'diamonds-95-thca'],

  // TIER 3 - Topicals
  ['CBD Muscle Relief Salve', 'wellness', null, 'cbd-muscle-salve'],
  ['THC:CBD Pain Cream 1:1', 'wellness', null, 'thc-cbd-pain-cream'],
  ['Premium CBD Bath Bomb', 'wellness', null, 'cbd-bath-bomb'],
  ['CBD Roll-On Pain Relief', 'wellness', null, 'cbd-roll-on'],
  ['CBN Sleep Topical Serum', 'wellness', null, 'cbn-sleep-serum'],
  ['CBD Facial Serum (Artisanal)', 'wellness', null, 'cbd-facial-serum'],
  ['THC Massage Oil', 'wellness', null, 'thc-massage-oil'],

  // TIER 3 - Delta-8/10
  ['Delta-8 THC Cartridge', 'vape pens', null, 'delta8-cart'],
  ['Delta-8 Gummies 10mg', 'edibles', null, 'delta8-gummies-10mg'],
  ['Delta-8 Tincture 1000mg', 'wellness', null, 'delta8-tincture'],
  ['Delta-10 THC Cartridge', 'vape pens', null, 'delta10-cart'],

  // TIER 3 - Minor Cannabinoids
  ['CBG Wellness Tincture', 'wellness', null, 'cbg-tincture'],
  ['CBG Gummies 10mg', 'edibles', null, 'cbg-gummies'],
  ['CBN Sleep Tincture', 'wellness', null, 'cbn-sleep'],
  ['CBN Sleep Gummies', 'edibles', null, 'cbn-sleep-gummies'],
  ['THCV Energy Tincture', 'wellness', null, 'thcv-energy'],

  // Enhancement - Edibles
  ['Runtz Chocolate Bar', 'edibles', null, 'runtz-chocolate'],
  ['Gelato Gummy Edibles', 'edibles', null, 'gelato-gummies'],
  ['Wedding Cake Chocolate', 'edibles', null, 'wedding-cake-choc'],

  // Enhancement - Vape
  ['STIIIZY Sauce Cartridge', 'vape pens', null, 'stiiizy-sauce'],
  ['CAKE Delta-8 Disposable', 'vape pens', null, 'cake-delta8-disposable'],
  ['Timeless Live Rosin Cart', 'vape pens', null, 'timeless-live-rosin'],

  // Enhancement - Flower
  ['Runtz Flower', 'flower', null, 'runtz'],
  ['Gelato Flower', 'flower', null, 'gelato'],
  ['Wedding Cake Flower', 'flower', null, 'wedding-cake'],
  ['Peanut Butter Breath Flower', 'flower', null, 'peanut-butter-breath'],
];

console.log(`\n📦 Adding ${newProducts.length} new products...\n`);

let added = 0;
let failed = 0;
const addedProducts = [];

for (const [name, category, brandId, slug] of newProducts) {
  try {
    const catId = catMap[category.toLowerCase()];
    if (!catId) {
      console.log(`⚠️  ${name}: Category "${category}" not found`);
      failed++;
      continue;
    }

    const [newProd] = await db
      .insert(products)
      .values({
        name,
        slug,
        categoryId: catId,
        brandId: brandId,
        description: `Premium ${name.toLowerCase()}. High quality cannabis product.`,
        thc: 20,
        cbd: 0,
        priceCents: 2500,
        stockQty: 10,
      })
      .returning({ id: products.id, slug: products.slug });

    addedProducts.push({
      id: newProd.id,
      name,
      slug: newProd.slug,
      category,
      url: `https://weedmap.store/shop/${category.toLowerCase().replace(' ', '-')}/${newProd.slug}`,
    });

    added++;
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

console.log(`\n✅ Successfully added: ${added} products`);
console.log(`❌ Failed: ${failed} products`);
console.log(`\n📋 PRODUCT URLs CREATED (for GSC submission):\n`);

addedProducts.forEach(p => {
  console.log(p.url);
});

console.log(`\n✨ ${addedProducts.length} URLs ready for Google Search Console`);
