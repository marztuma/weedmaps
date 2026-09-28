import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Get all products and images
const allProducts = await db.select().from(products);

// Get all available images
const result = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'weedmaps',
  max_results: 500,
});

const cloudinaryImages = {};
result.resources.forEach(r => {
  const parts = r.public_id.split('/');
  const cat = parts[1];
  const name = parts[2];
  if (!cloudinaryImages[cat]) cloudinaryImages[cat] = [];
  cloudinaryImages[cat].push(r.public_id);
});

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

// Fix the HIGH priority issues first
console.log('Fixing HIGH priority products...\n');

const highPriorityProducts = allProducts.filter(p => imageFixes[p.name]);

for (const prod of highPriorityProducts) {
  const newImageId = imageFixes[prod.name];

  // Check if this image exists
  const exists = result.resources.some(r => r.public_id === newImageId);

  if (exists) {
    await db.update(products)
      .set({ imageCloudId: newImageId })
      .where(eq(products.id, prod.id));

    console.log(`✓ ${prod.name}: ${prod.imageCloudId} → ${newImageId}`);
  } else {
    console.log(`✗ ${prod.name}: Image not found in Cloudinary: ${newImageId}`);
  }
}

console.log(`\n✓ Fixed ${highPriorityProducts.length} HIGH priority products`);
