import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Define correct image mappings for HIGH priority products
const imageFixes = {
  'Big Battery': 'weedmaps/vape/diamondbatteries-21',
  'Blue Burst Pod': 'weedmaps/vape/pr-x-biscotti',
  'Biscotti Pod': 'weedmaps/vape/pr-x-biscotti',
  'Blueberries': 'weedmaps/edibles/wyld-10ct-box-us-fruit-marionberry-gummies-shadow',
  'Camino Wild Berry': 'weedmaps/edibles/render-ff-gummies-peach-greentin-flat',
  'Churro Milk Chocolate': 'weedmaps/edibles/kiva-ca-cartonchocolate-onwhite-rgb-churro-201026',
  'Boulder Bar': 'weedmaps/edibles/incredibles-chocolate-pbb-upright2-web',
  'Cookies & Cream': 'weedmaps/edibles/incredibles-chocolate-strawberrycrunch-upright2-wen',
};

async function fixWithRetry(productId, newImageId, productName, retries = 3) {
  while (retries > 0) {
    try {
      await db.update(products)
        .set({ imageCloudId: newImageId })
        .where(eq(products.id, productId));
      return true;
    } catch (e) {
      retries--;
      if (retries === 0) {
        console.error(`✗ ${productName}: Update failed`);
        return false;
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

console.log('Fixing HIGH priority products...\n');

// Get all products and find the ones to fix
let allProducts;
let retries = 3;
while (retries > 0) {
  try {
    allProducts = await db.select().from(products);
    break;
  } catch (e) {
    retries--;
    if (retries === 0) throw e;
    await new Promise(r => setTimeout(r, 1000));
  }
}

const highPriorityProducts = allProducts.filter(p => imageFixes[p.name]);

for (const prod of highPriorityProducts) {
  const newImageId = imageFixes[prod.name];
  const success = await fixWithRetry(prod.id, newImageId, prod.name);

  if (success) {
    console.log(`✓ ${prod.name}: ${newImageId.split('/').pop()}`);
  }
}

console.log(`\n✓ Fixed ${highPriorityProducts.length} HIGH priority products`);
