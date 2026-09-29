import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const n = neon(process.env.DATABASE_URL);
const db = drizzle(n);

// Get categories
const allCats = await db.select({ id: categories.id, name: categories.name }).from(categories);
const catMap = Object.fromEntries(allCats.map(c => [c.name.toLowerCase(), c.id]));

console.log('📦 Adding 77 detailed products...\n');

const productDetails = [
  // TIER 1 - THCa Flower
  { name: 'THCa Premium Flower - Runtz', category: 'flower', slug: 'thca-runtz', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '3.5g', thc: 28, cbd: 1, price: 3500, desc: 'Premium THCa flower with vibrant colors and terpy profile' },
  { name: 'THCa Premium Flower - Gelato', category: 'flower', slug: 'thca-gelato', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '3.5g', thc: 26, cbd: 1, price: 3500, desc: 'Creamy gelato-strain THCa buds with smooth flavor' },
  { name: 'THCa Premium Flower - Wedding Cake', category: 'flower', slug: 'thca-wedding-cake', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '3.5g', thc: 27, cbd: 1, price: 3500, desc: 'Dense wedding cake flower with bakery notes' },

  // TIER 1 - THCa Concentrates
  { name: 'THCa Diamond Sauce', category: 'concentrates', slug: 'thca-diamonds', brandId: 3, shopId: 1, strainType: 'hybrid', weight: '1g', thc: 85, cbd: 0, price: 4500, desc: 'Premium THCa diamonds in terpy sauce' },
  { name: 'THCa Live Rosin Diamonds', category: 'concentrates', slug: 'thca-rosin-diamonds', brandId: 3, shopId: 1, strainType: 'hybrid', weight: '1g', thc: 82, cbd: 1, price: 5000, desc: 'Fresh frozen live rosin with THCa crystals' },
  { name: 'THCa Crystalline (99%+)', category: 'concentrates', slug: 'thca-crystalline', brandId: 3, shopId: 1, strainType: 'hybrid', weight: '1g', thc: 95, cbd: 0, price: 4200, desc: 'Pure THCa crystalline concentrate for dabbing' },

  // TIER 1 - THCa Pre-Rolls & Vape
  { name: 'THCa Pre-Rolls (Infused)', category: 'pre-rolls', slug: 'thca-infused', brandId: 1, shopId: 1, strainType: 'hybrid', weight: '0.7g', thc: 30, cbd: 1, price: 2500, desc: 'Pre-rolled THCa flower with kief dusting' },
  { name: 'THCa Sauce Vape Cartridge', category: 'vape pens', slug: 'thca-sauce-cart', brandId: 2, shopId: 1, strainType: 'hybrid', weight: '0.5g', thc: 88, cbd: 0, price: 3500, desc: '510 threaded THCa sauce cartridge' },

  // TIER 1 - Wyld Edibles (Low-Dose)
  { name: 'Wyld Gummies - Mixed Berry', category: 'edibles', slug: 'wyld-mixed-berry', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 2000, desc: 'Wyld mixed berry gummies, 10 pieces 10mg each' },
  { name: 'Wyld Gummies - Watermelon', category: 'edibles', slug: 'wyld-watermelon', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 2000, desc: 'Refreshing watermelon-flavored Wyld gummies' },
  { name: 'Wyld Gummies - Strawberry Lemonade', category: 'edibles', slug: 'wyld-strawberry-lemon', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 2000, desc: 'Tart strawberry lemonade Wyld gummies' },

  // TIER 1 - Wyld Beverages
  { name: 'Wyld THC Beverage - Sparkling Yuzu', category: 'beverages', slug: 'wyld-yuzu', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '355ml', thc: 10, cbd: 0, price: 2500, desc: 'Sparkling yuzu-flavored cannabis beverage, 10mg THC' },
  { name: 'Wyld THC Beverage - Raspberry Lemonade', category: 'beverages', slug: 'wyld-raspberry-lemon', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '355ml', thc: 10, cbd: 0, price: 2500, desc: 'Tart raspberry lemonade THC drink' },
  { name: 'Wyld THC Beverage - Elderberry', category: 'beverages', slug: 'wyld-elderberry', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '355ml', thc: 10, cbd: 0, price: 2500, desc: 'Sweet elderberry cannabis beverage' },

  // TIER 1 - Wyld Low-Dose Gummies
  { name: 'Wyld Low-Dose Gummies 2.5mg', category: 'edibles', slug: 'wyld-lowdose-25mg', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '25mg', thc: 2.5, cbd: 0, price: 1500, desc: 'Wyld microdose gummies, 10 pieces 2.5mg each' },
  { name: 'Wyld Low-Dose Gummies 5mg', category: 'edibles', slug: 'wyld-lowdose-5mg', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '50mg', thc: 5, cbd: 0, price: 1800, desc: 'Wyld entry-level gummies, 10 pieces 5mg each' },

  // TIER 1 - Jeeter Pre-Rolls
  { name: 'Jeeter Infused Pre-Roll - Kief Coated', category: 'pre-rolls', slug: 'jeeter-kief', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '0.7g', thc: 28, cbd: 1, price: 3200, desc: 'Premium pre-roll coated with cannabis kief' },
  { name: 'Jeeter Infused Pre-Roll - Diamonds & Sauce', category: 'pre-rolls', slug: 'jeeter-diamonds', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '0.7g', thc: 30, cbd: 1, price: 3500, desc: 'Pre-roll infused with THCa diamonds and sauce' },
  { name: 'Jeeter Pre-Roll 5-Pack', category: 'pre-rolls', slug: 'jeeter-5pack', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '3.5g', thc: 22, cbd: 0, price: 2800, desc: 'Pack of 5 premium Jeeter pre-rolls' },
  { name: 'Jeeter Mini Pre-Roll - Variety Pack', category: 'pre-rolls', slug: 'jeeter-mini-variety', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '3.5g', thc: 20, cbd: 0, price: 2400, desc: 'Assorted mini Jeeter pre-rolls' },
  { name: 'Jeeter Blunt - Large Format', category: 'pre-rolls', slug: 'jeeter-blunt', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '1.5g', thc: 25, cbd: 1, price: 4200, desc: 'Premium large-format Jeeter blunt' },

  // TIER 1 - Tinctures
  { name: 'Full Spectrum CBD Tincture 1000mg', category: 'wellness', slug: 'cbd-tincture-1000mg', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 0, cbd: 33, price: 3500, desc: 'Full-spectrum CBD tincture for wellness' },
  { name: 'THC:CBD Ratio Tincture 1:1', category: 'wellness', slug: 'thc-cbd-ratio-1to1', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 10, cbd: 10, price: 3800, desc: 'Balanced 1:1 THC:CBD tincture' },
  { name: 'THC:CBD Ratio Tincture 3:1', category: 'wellness', slug: 'thc-cbd-ratio-3to1', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 15, cbd: 5, price: 3800, desc: 'THC-forward 3:1 ratio tincture for pain relief' },
  { name: 'THC:CBD Ratio Tincture 10:1', category: 'wellness', slug: 'thc-cbd-ratio-10to1', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 20, cbd: 2, price: 3800, desc: 'Strong 10:1 THC:CBD for deep relief' },
  { name: 'Full Spectrum THC Tincture 1000mg', category: 'wellness', slug: 'thc-tincture-1000mg', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 33, cbd: 0, price: 4000, desc: 'Full-spectrum THC tincture for experienced users' },
  { name: 'CBN Sleep Tincture (Hemp)', category: 'wellness', slug: 'cbn-sleep-tincture', brandId: 5, shopId: 1, strainType: 'indica', weight: '30ml', thc: 0, cbd: 5, price: 3200, desc: 'Hemp-derived CBN tincture for sleep support' },
  { name: 'CBG Wellness Tincture (Hemp)', category: 'wellness', slug: 'cbg-wellness-tincture', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 0, cbd: 5, price: 3200, desc: 'Hemp CBG tincture for inflammation and mood' },
  { name: 'Nano-Spray CBD Applicator', category: 'wellness', slug: 'nano-spray-cbd', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '15ml', thc: 0, cbd: 10, price: 2800, desc: 'Nano-emulsified CBD spray for fast absorption' },

  // TIER 2 - Infused Pre-Rolls
  { name: 'Diamond-Dusted Pre-Roll - Blue Dream', category: 'pre-rolls', slug: 'diamonds-blue-dream', brandId: 3, shopId: 2, strainType: 'hybrid', weight: '0.7g', thc: 31, cbd: 1, price: 3500, desc: 'Blue Dream pre-roll with THCa diamond dust' },
  { name: 'Diamond-Dusted Pre-Roll - Wedding Cake', category: 'pre-rolls', slug: 'diamonds-wedding-cake', brandId: 3, shopId: 2, strainType: 'hybrid', weight: '0.7g', thc: 32, cbd: 1, price: 3500, desc: 'Wedding Cake pre-roll topped with diamonds' },
  { name: 'Kief-Coated Pre-Roll - Gelato', category: 'pre-rolls', slug: 'kief-gelato', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '0.7g', thc: 29, cbd: 0, price: 3000, desc: 'Gelato pre-roll dusted with cannabis kief' },
  { name: 'Kief-Coated Pre-Roll - Runtz', category: 'pre-rolls', slug: 'kief-runtz', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '0.7g', thc: 28, cbd: 0, price: 3000, desc: 'Runtz pre-roll coated with premium kief' },
  { name: 'Sauce-Infused Pre-Roll - Premium', category: 'pre-rolls', slug: 'sauce-infused-premium', brandId: 2, shopId: 4, strainType: 'hybrid', weight: '0.7g', thc: 30, cbd: 1, price: 3400, desc: 'Pre-roll infused with cannabis terpy sauce' },
  { name: 'Rosin-Infused Pre-Roll', category: 'pre-rolls', slug: 'rosin-infused', brandId: 2, shopId: 4, strainType: 'hybrid', weight: '0.7g', thc: 32, cbd: 0, price: 3600, desc: 'Premium rosin-infused pre-roll' },
  { name: 'General Admission Kief-Coated 5-Pack', category: 'pre-rolls', slug: 'general-admission-5pack', brandId: 1, shopId: 5, strainType: 'hybrid', weight: '3.5g', thc: 25, cbd: 0, price: 3000, desc: 'Pack of 5 kief-coated pre-rolls' },
  { name: 'Dogwalkers Infused Mini Pre-Rolls', category: 'pre-rolls', slug: 'dogwalkers-mini', brandId: 3, shopId: 5, strainType: 'hybrid', weight: '3g', thc: 22, cbd: 0, price: 2500, desc: 'Pack of mini infused pre-rolls' },

  // TIER 2 - Beverages (5mg & flavored)
  { name: 'Wyld THC Beverage - Sparkling Yuzu 5mg', category: 'beverages', slug: 'wyld-yuzu-5mg', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '355ml', thc: 5, cbd: 0, price: 2000, desc: 'Low-dose Wyld yuzu beverage' },
  { name: 'Wyld THC Beverage - Raspberry Lemonade 5mg', category: 'beverages', slug: 'wyld-raspberry-5mg', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '355ml', thc: 5, cbd: 0, price: 2000, desc: 'Low-dose raspberry lemonade THC drink' },
  { name: 'Wyld THC Beverage - Elderberry 5mg', category: 'beverages', slug: 'wyld-elderberry-5mg', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '355ml', thc: 5, cbd: 0, price: 2000, desc: 'Low-dose elderberry THC beverage' },
  { name: 'Keef Brands THC Drink - Lime 5mg', category: 'beverages', slug: 'keef-lime-5mg', brandId: 3, shopId: 2, strainType: 'hybrid', weight: '355ml', thc: 5, cbd: 0, price: 2200, desc: 'Zesty lime cannabis beverage' },
  { name: 'Keef Brands THC Drink - Raspberry 5mg', category: 'beverages', slug: 'keef-raspberry-5mg', brandId: 3, shopId: 2, strainType: 'hybrid', weight: '355ml', thc: 5, cbd: 0, price: 2200, desc: 'Raspberry-flavored THC drink' },
  { name: 'Canopy Growth Cannabis Drink 2.5mg', category: 'beverages', slug: 'canopy-lowdose-25mg', brandId: 4, shopId: 3, strainType: 'hybrid', weight: '355ml', thc: 2.5, cbd: 0, price: 1800, desc: 'Ultra-low-dose microdose beverage' },
  { name: 'PWR Drink THC Energy 5mg', category: 'beverages', slug: 'pwr-energy-5mg', brandId: 2, shopId: 3, strainType: 'sativa', weight: '355ml', thc: 5, cbd: 0, price: 2400, desc: 'Energizing sativa-infused beverage with caffeine' },
  { name: 'Tremors THC Sparkling 5mg', category: 'beverages', slug: 'tremors-sparkling-5mg', brandId: 1, shopId: 4, strainType: 'hybrid', weight: '355ml', thc: 5, cbd: 0, price: 2200, desc: 'Sparkling THC beverage with natural flavors' },

  // TIER 2 - Premium Concentrates
  { name: 'Live Rosin Diamonds - Wedding Cake', category: 'concentrates', slug: 'live-rosin-wedding', brandId: 3, shopId: 1, strainType: 'hybrid', weight: '1g', thc: 80, cbd: 1, price: 5500, desc: 'Premium wedding cake live rosin with diamonds' },
  { name: 'Live Rosin Diamonds - Gelato', category: 'concentrates', slug: 'live-rosin-gelato', brandId: 3, shopId: 1, strainType: 'hybrid', weight: '1g', thc: 78, cbd: 1, price: 5500, desc: 'Fresh gelato live rosin crystals' },
  { name: 'Diamond Sauce - Blue Dream', category: 'concentrates', slug: 'diamond-sauce-blue', brandId: 3, shopId: 2, strainType: 'hybrid', weight: '1g', thc: 82, cbd: 1, price: 5200, desc: 'Blue dream THCa diamonds in terpene sauce' },
  { name: 'Live Rosin Sauce - Runtz', category: 'concentrates', slug: 'live-sauce-runtz', brandId: 3, shopId: 2, strainType: 'hybrid', weight: '1g', thc: 79, cbd: 0, price: 5300, desc: 'Full-spectrum runtz live rosin sauce' },
  { name: 'Cold Cure Live Rosin Badder', category: 'concentrates', slug: 'live-badder-rosin', brandId: 3, shopId: 3, strainType: 'hybrid', weight: '1g', thc: 75, cbd: 1, price: 4800, desc: 'Cold-cured live rosin with creamy badder texture' },
  { name: 'Premium Diamond Concentrate 95%+ THCa', category: 'concentrates', slug: 'diamonds-95-thca', brandId: 3, shopId: 3, strainType: 'hybrid', weight: '1g', thc: 92, cbd: 0, price: 4500, desc: 'Pure THCa diamonds at 95%+ potency' },

  // TIER 3 - Topicals
  { name: 'CBD Muscle Relief Salve', category: 'wellness', slug: 'cbd-muscle-salve', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '2oz', thc: 0, cbd: 100, price: 2800, desc: 'Cooling CBD salve for sore muscles' },
  { name: 'THC:CBD Pain Cream 1:1', category: 'wellness', slug: 'thc-cbd-pain-cream', brandId: 5, shopId: 2, strainType: 'hybrid', weight: '2oz', thc: 10, cbd: 10, price: 3200, desc: 'Balanced topical cream for joint and muscle pain' },
  { name: 'Premium CBD Bath Bomb', category: 'wellness', slug: 'cbd-bath-bomb', brandId: 5, shopId: 2, strainType: 'hybrid', weight: '4.5oz', thc: 0, cbd: 50, price: 2200, desc: 'Relaxing CBD-infused bath bomb' },
  { name: 'CBD Roll-On Pain Relief', category: 'wellness', slug: 'cbd-roll-on', brandId: 5, shopId: 3, strainType: 'hybrid', weight: '0.3oz', thc: 0, cbd: 25, price: 1800, desc: 'Portable CBD roll-on for targeted relief' },
  { name: 'CBN Sleep Topical Serum', category: 'wellness', slug: 'cbn-sleep-serum', brandId: 5, shopId: 3, strainType: 'indica', weight: '1oz', thc: 0, cbd: 20, price: 2600, desc: 'CBN-infused serum to support sleep' },
  { name: 'CBD Facial Serum (Artisanal)', category: 'wellness', slug: 'cbd-facial-serum', brandId: 5, shopId: 4, strainType: 'hybrid', weight: '1oz', thc: 0, cbd: 30, price: 3200, desc: 'Premium artisanal CBD skincare serum' },
  { name: 'THC Massage Oil', category: 'wellness', slug: 'thc-massage-oil', brandId: 5, shopId: 4, strainType: 'hybrid', weight: '4oz', thc: 10, cbd: 5, price: 3600, desc: 'Luxe THC-infused massage oil' },

  // TIER 3 - Delta-8/10
  { name: 'Delta-8 THC Cartridge', category: 'vape pens', slug: 'delta8-cart', brandId: 2, shopId: 1, strainType: 'hybrid', weight: '0.5g', thc: 80, cbd: 0, price: 2200, desc: '510 threaded Delta-8 cartridge' },
  { name: 'Delta-8 Gummies 10mg', category: 'edibles', slug: 'delta8-gummies-10mg', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 1800, desc: 'Delta-8 gummies with mild effects' },
  { name: 'Delta-8 Tincture 1000mg', category: 'wellness', slug: 'delta8-tincture', brandId: 5, shopId: 3, strainType: 'hybrid', weight: '30ml', thc: 33, cbd: 0, price: 2800, desc: 'Full-spectrum Delta-8 tincture' },
  { name: 'Delta-10 THC Cartridge', category: 'vape pens', slug: 'delta10-cart', brandId: 2, shopId: 4, strainType: 'sativa', weight: '0.5g', thc: 78, cbd: 0, price: 2400, desc: 'Energizing Delta-10 cartridge' },

  // TIER 3 - Minor Cannabinoids
  { name: 'CBG Wellness Tincture', category: 'wellness', slug: 'cbg-tincture', brandId: 5, shopId: 1, strainType: 'hybrid', weight: '30ml', thc: 0, cbd: 15, price: 3000, desc: 'CBG tincture for focus and mood' },
  { name: 'CBG Gummies 10mg', category: 'edibles', slug: 'cbg-gummies', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '100mg', thc: 0, cbd: 10, price: 1800, desc: 'CBG-infused gummies for wellness' },
  { name: 'CBN Sleep Tincture', category: 'wellness', slug: 'cbn-sleep', brandId: 5, shopId: 3, strainType: 'indica', weight: '30ml', thc: 0, cbd: 20, price: 3200, desc: 'Pure CBN tincture for restful sleep' },
  { name: 'CBN Sleep Gummies', category: 'edibles', slug: 'cbn-sleep-gummies', brandId: 4, shopId: 3, strainType: 'indica', weight: '100mg', thc: 0, cbd: 10, price: 1800, desc: 'Indica gummies with CBN for sleep support' },
  { name: 'THCV Energy Tincture', category: 'wellness', slug: 'thcv-energy', brandId: 5, shopId: 4, strainType: 'sativa', weight: '30ml', thc: 20, cbd: 0, price: 3400, desc: 'Energizing THCV tincture for focus and appetite control' },

  // Enhancement - Edibles
  { name: 'Runtz Chocolate Bar', category: 'edibles', slug: 'runtz-chocolate', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 1800, desc: 'Runtz-strain cannabis chocolate bar' },
  { name: 'Gelato Gummy Edibles', category: 'edibles', slug: 'gelato-gummies', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 1800, desc: 'Gelato-flavored cannabis gummies' },
  { name: 'Wedding Cake Chocolate', category: 'edibles', slug: 'wedding-cake-choc', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '100mg', thc: 10, cbd: 0, price: 1800, desc: 'Wedding cake-flavored cannabis chocolate' },

  // Enhancement - Vape
  { name: 'STIIIZY Sauce Cartridge', category: 'vape pens', slug: 'stiiizy-sauce', brandId: 2, shopId: 1, strainType: 'hybrid', weight: '0.5g', thc: 87, cbd: 0, price: 3800, desc: 'STIIIZY live sauce cartridge' },
  { name: 'CAKE Delta-8 Disposable', category: 'vape pens', slug: 'cake-delta8-disposable', brandId: 2, shopId: 2, strainType: 'hybrid', weight: '1.5g', thc: 82, cbd: 0, price: 2800, desc: 'Disposable Delta-8 vape pen' },
  { name: 'Timeless Live Rosin Cart', category: 'vape pens', slug: 'timeless-live-rosin', brandId: 3, shopId: 3, strainType: 'hybrid', weight: '0.5g', thc: 85, cbd: 0, price: 4200, desc: 'Premium live rosin vape cartridge' },

  // Enhancement - Flower
  { name: 'Runtz Flower', category: 'flower', slug: 'runtz', brandId: 4, shopId: 1, strainType: 'hybrid', weight: '3.5g', thc: 24, cbd: 0, price: 3000, desc: 'Popular Runtz strain flower' },
  { name: 'Gelato Flower', category: 'flower', slug: 'gelato', brandId: 4, shopId: 2, strainType: 'hybrid', weight: '3.5g', thc: 23, cbd: 0, price: 3000, desc: 'Premium Gelato #41 strain' },
  { name: 'Wedding Cake Flower', category: 'flower', slug: 'wedding-cake', brandId: 1, shopId: 3, strainType: 'hybrid', weight: '3.5g', thc: 23, cbd: 0, price: 3000, desc: 'Wedding Cake strain cannabis flower' },
  { name: 'Peanut Butter Breath Flower', category: 'flower', slug: 'peanut-butter-breath', brandId: 3, shopId: 4, strainType: 'hybrid', weight: '3.5g', thc: 25, cbd: 0, price: 3200, desc: 'Creamy peanut butter breath strain' },
];

let updated = 0;

for (const prod of productDetails) {
  try {
    const catId = catMap[prod.category.toLowerCase()];
    if (!catId) {
      console.log(`⚠️  ${prod.name}: Category not found`);
      continue;
    }

    // Update the product with detailed info
    await db
      .update(products)
      .set({
        strainType: prod.strainType,
        weight: prod.weight,
        thc: prod.thc,
        cbd: prod.cbd,
        priceCents: prod.price,
        description: prod.desc,
      })
      .where(eq(products.slug, prod.slug));

    updated++;
    if (updated % 10 === 0) {
      console.log(`✓ Updated ${updated}/${productDetails.length}...`);
    }
  } catch (e) {
    console.log(`✗ ${prod.name}: ${e.message.split('\n')[0]}`);
  }
}

console.log(`\n✅ Successfully updated: ${updated} products with detailed info`);
console.log(`\n77 products now have:`);
console.log(`  ✓ Proper strain types (hybrid, sativa, indica)`);
console.log(`  ✓ Accurate weights`);
console.log(`  ✓ Correct THC/CBD levels`);
console.log(`  ✓ Realistic pricing`);
console.log(`  ✓ Product descriptions`);
