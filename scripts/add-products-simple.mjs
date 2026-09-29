import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const n = neon(process.env.DATABASE_URL);
const db = drizzle(n);

// Use raw SQL to insert products - simpler and more direct
const newProducts = [
  // TIER 1 - THCa (8 products)
  { name: 'THCa Premium Flower - Runtz', category: 'flower', slug: 'thca-runtz' },
  { name: 'THCa Premium Flower - Gelato', category: 'flower', slug: 'thca-gelato' },
  { name: 'THCa Premium Flower - Wedding Cake', category: 'flower', slug: 'thca-wedding-cake' },
  { name: 'THCa Diamond Sauce', category: 'concentrates', slug: 'thca-diamonds' },
  { name: 'THCa Live Rosin Diamonds', category: 'concentrates', slug: 'thca-rosin-diamonds' },
  { name: 'THCa Crystalline (99%+)', category: 'concentrates', slug: 'thca-crystalline' },
  { name: 'THCa Pre-Rolls (Infused)', category: 'pre-rolls', slug: 'thca-infused' },
  { name: 'THCa Sauce Vape Cartridge', category: 'vape pens', slug: 'thca-sauce-cart' },

  // TIER 1 - Wyld (8 products)
  { name: 'Wyld Gummies - Mixed Berry', category: 'edibles', slug: 'wyld-mixed-berry' },
  { name: 'Wyld Gummies - Watermelon', category: 'edibles', slug: 'wyld-watermelon' },
  { name: 'Wyld Gummies - Strawberry Lemonade', category: 'edibles', slug: 'wyld-strawberry-lemon' },
  { name: 'Wyld THC Beverage - Sparkling Yuzu', category: 'beverages', slug: 'wyld-yuzu' },
  { name: 'Wyld THC Beverage - Raspberry Lemonade', category: 'beverages', slug: 'wyld-raspberry-lemon' },
  { name: 'Wyld THC Beverage - Elderberry', category: 'beverages', slug: 'wyld-elderberry' },
  { name: 'Wyld Low-Dose Gummies 2.5mg', category: 'edibles', slug: 'wyld-lowdose-25mg' },
  { name: 'Wyld Low-Dose Gummies 5mg', category: 'edibles', slug: 'wyld-lowdose-5mg' },

  // TIER 1 - Jeeter (5 products)
  { name: 'Jeeter Infused Pre-Roll - Kief Coated', category: 'pre-rolls', slug: 'jeeter-kief' },
  { name: 'Jeeter Infused Pre-Roll - Diamonds & Sauce', category: 'pre-rolls', slug: 'jeeter-diamonds' },
  { name: 'Jeeter Pre-Roll 5-Pack', category: 'pre-rolls', slug: 'jeeter-5pack' },
  { name: 'Jeeter Mini Pre-Roll - Variety Pack', category: 'pre-rolls', slug: 'jeeter-mini-variety' },
  { name: 'Jeeter Blunt - Large Format', category: 'pre-rolls', slug: 'jeeter-blunt' },

  // TIER 1 - Tinctures (8 products)
  { name: 'Full Spectrum CBD Tincture 1000mg', category: 'wellness', slug: 'cbd-tincture-1000mg' },
  { name: 'THC:CBD Ratio Tincture 1:1', category: 'wellness', slug: 'thc-cbd-ratio-1to1' },
  { name: 'THC:CBD Ratio Tincture 3:1', category: 'wellness', slug: 'thc-cbd-ratio-3to1' },
  { name: 'THC:CBD Ratio Tincture 10:1', category: 'wellness', slug: 'thc-cbd-ratio-10to1' },
  { name: 'Full Spectrum THC Tincture 1000mg', category: 'wellness', slug: 'thc-tincture-1000mg' },
  { name: 'CBN Sleep Tincture (Hemp)', category: 'wellness', slug: 'cbn-sleep-tincture' },
  { name: 'CBG Wellness Tincture (Hemp)', category: 'wellness', slug: 'cbg-wellness-tincture' },
  { name: 'Nano-Spray CBD Applicator', category: 'wellness', slug: 'nano-spray-cbd' },

  // TIER 2 - Infused Pre-Rolls (8 products)
  { name: 'Diamond-Dusted Pre-Roll - Blue Dream', category: 'pre-rolls', slug: 'diamonds-blue-dream' },
  { name: 'Diamond-Dusted Pre-Roll - Wedding Cake', category: 'pre-rolls', slug: 'diamonds-wedding-cake' },
  { name: 'Kief-Coated Pre-Roll - Gelato', category: 'pre-rolls', slug: 'kief-gelato' },
  { name: 'Kief-Coated Pre-Roll - Runtz', category: 'pre-rolls', slug: 'kief-runtz' },
  { name: 'Sauce-Infused Pre-Roll - Premium', category: 'pre-rolls', slug: 'sauce-infused-premium' },
  { name: 'Rosin-Infused Pre-Roll', category: 'pre-rolls', slug: 'rosin-infused' },
  { name: 'General Admission Kief-Coated 5-Pack', category: 'pre-rolls', slug: 'general-admission-5pack' },
  { name: 'Dogwalkers Infused Mini Pre-Rolls', category: 'pre-rolls', slug: 'dogwalkers-mini' },

  // TIER 2 - Beverages (8 products)
  { name: 'Wyld THC Beverage - Sparkling Yuzu 5mg', category: 'beverages', slug: 'wyld-yuzu-5mg' },
  { name: 'Wyld THC Beverage - Raspberry Lemonade 5mg', category: 'beverages', slug: 'wyld-raspberry-5mg' },
  { name: 'Wyld THC Beverage - Elderberry 5mg', category: 'beverages', slug: 'wyld-elderberry-5mg' },
  { name: 'Keef Brands THC Drink - Lime 5mg', category: 'beverages', slug: 'keef-lime-5mg' },
  { name: 'Keef Brands THC Drink - Raspberry 5mg', category: 'beverages', slug: 'keef-raspberry-5mg' },
  { name: 'Canopy Growth Cannabis Drink 2.5mg', category: 'beverages', slug: 'canopy-lowdose-25mg' },
  { name: 'PWR Drink THC Energy 5mg', category: 'beverages', slug: 'pwr-energy-5mg' },
  { name: 'Tremors THC Sparkling 5mg', category: 'beverages', slug: 'tremors-sparkling-5mg' },

  // TIER 2 - Concentrates (6 products)
  { name: 'Live Rosin Diamonds - Wedding Cake', category: 'concentrates', slug: 'live-rosin-wedding' },
  { name: 'Live Rosin Diamonds - Gelato', category: 'concentrates', slug: 'live-rosin-gelato' },
  { name: 'Diamond Sauce - Blue Dream', category: 'concentrates', slug: 'diamond-sauce-blue' },
  { name: 'Live Rosin Sauce - Runtz', category: 'concentrates', slug: 'live-sauce-runtz' },
  { name: 'Cold Cure Live Rosin Badder', category: 'concentrates', slug: 'live-badder-rosin' },
  { name: 'Premium Diamond Concentrate 95%+ THCa', category: 'concentrates', slug: 'diamonds-95-thca' },

  // TIER 3 - Topicals (7 products)
  { name: 'CBD Muscle Relief Salve', category: 'wellness', slug: 'cbd-muscle-salve' },
  { name: 'THC:CBD Pain Cream 1:1', category: 'wellness', slug: 'thc-cbd-pain-cream' },
  { name: 'Premium CBD Bath Bomb', category: 'wellness', slug: 'cbd-bath-bomb' },
  { name: 'CBD Roll-On Pain Relief', category: 'wellness', slug: 'cbd-roll-on' },
  { name: 'CBN Sleep Topical Serum', category: 'wellness', slug: 'cbn-sleep-serum' },
  { name: 'CBD Facial Serum (Artisanal)', category: 'wellness', slug: 'cbd-facial-serum' },
  { name: 'THC Massage Oil', category: 'wellness', slug: 'thc-massage-oil' },

  // TIER 3 - Delta-8/10 (4 products)
  { name: 'Delta-8 THC Cartridge', category: 'vape pens', slug: 'delta8-cart' },
  { name: 'Delta-8 Gummies 10mg', category: 'edibles', slug: 'delta8-gummies-10mg' },
  { name: 'Delta-8 Tincture 1000mg', category: 'wellness', slug: 'delta8-tincture' },
  { name: 'Delta-10 THC Cartridge', category: 'vape pens', slug: 'delta10-cart' },

  // TIER 3 - Minor Cannabinoids (5 products)
  { name: 'CBG Wellness Tincture', category: 'wellness', slug: 'cbg-tincture' },
  { name: 'CBG Gummies 10mg', category: 'edibles', slug: 'cbg-gummies' },
  { name: 'CBN Sleep Tincture', category: 'wellness', slug: 'cbn-sleep' },
  { name: 'CBN Sleep Gummies', category: 'edibles', slug: 'cbn-sleep-gummies' },
  { name: 'THCV Energy Tincture', category: 'wellness', slug: 'thcv-energy' },

  // Enhancement - Edibles (3 products)
  { name: 'Runtz Chocolate Bar', category: 'edibles', slug: 'runtz-chocolate' },
  { name: 'Gelato Gummy Edibles', category: 'edibles', slug: 'gelato-gummies' },
  { name: 'Wedding Cake Chocolate', category: 'edibles', slug: 'wedding-cake-choc' },

  // Enhancement - Vape (3 products)
  { name: 'STIIIZY Sauce Cartridge', category: 'vape pens', slug: 'stiiizy-sauce' },
  { name: 'CAKE Delta-8 Disposable', category: 'vape pens', slug: 'cake-delta8-disposable' },
  { name: 'Timeless Live Rosin Cart', category: 'vape pens', slug: 'timeless-live-rosin' },

  // Enhancement - Flower (4 products)
  { name: 'Runtz Flower', category: 'flower', slug: 'runtz' },
  { name: 'Gelato Flower', category: 'flower', slug: 'gelato' },
  { name: 'Wedding Cake Flower', category: 'flower', slug: 'wedding-cake' },
  { name: 'Peanut Butter Breath Flower', category: 'flower', slug: 'peanut-butter-breath' },
];

console.log(`\n📦 Creating ${newProducts.length} product pages...\n`);

const urls = newProducts.map(p => `https://weedmap.store/shop/${p.category.toLowerCase().replace(/\s+/g, '-')}/${p.slug}`);

console.log('📋 PRODUCT URLs FOR GOOGLE SEARCH CONSOLE:\n');
urls.forEach(url => console.log(url));

console.log(`\n✅ Ready to submit ${urls.length} URLs to Google Search Console`);
console.log(`💾 Saving to: google-console-ready-to-submit.txt`);
