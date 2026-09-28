import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Get all products and categories
const allProducts = await db.select().from(products);
const allCategories = await db.select().from(categories);

const catMap = Object.fromEntries(allCategories.map(c => [c.id, c.name]));

// Get all available images from Cloudinary
const result = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'weedmaps',
  max_results: 500,
});

const imagesByFolder = {};
result.resources.forEach(r => {
  const parts = r.public_id.split('/');
  const folder = parts[1];
  if (!imagesByFolder[folder]) imagesByFolder[folder] = [];
  imagesByFolder[folder].push(r.public_id);
});

// Map product categories to image folders
const categoryToFolder = {
  'Flower': 'flower',
  'Vape pens': 'vape',
  'Edibles': 'edibles',
  'Pre-rolls': 'pre-rolls',
  'Concentrates': 'concentrates',
  'Beverages': 'beverages',
  'Gear': 'gear',
  'Wellness': 'edibles',
  'Genetics': 'flower',
};

// Group products by category
const productsByCategory = {};
allProducts.forEach(p => {
  const catName = catMap[p.categoryId];
  if (!productsByCategory[catName]) productsByCategory[catName] = [];
  productsByCategory[catName].push(p);
});

console.log('Distributing images by category...\n');

for (const [catName, prods] of Object.entries(productsByCategory)) {
  const folder = categoryToFolder[catName];
  if (!folder) continue;

  const availableImages = imagesByFolder[folder] || [];
  if (availableImages.length === 0) {
    console.log(`⚠ No images available for ${catName}`);
    continue;
  }

  console.log(`${catName}: ${prods.length} products, ${availableImages.length} images available`);

  // Distribute images round-robin
  for (let i = 0; i < prods.length; i++) {
    const imageIdx = i % availableImages.length;
    const newImageId = availableImages[imageIdx];

    const prod = prods[i];
    if (prod.imageCloudId !== newImageId) {
      await db.update(products)
        .set({ imageCloudId: newImageId })
        .where(eq(products.id, prod.id));

      // Show sample updates
      if (i < 3 || i === prods.length - 1) {
        console.log(`  ${prod.name} ← ${newImageId.split('/').pop()}`);
      } else if (i === 3) {
        console.log(`  ... (${prods.length - 6} more) ...`);
      }
    }
  }

  console.log();
}

console.log('✓ Image distribution complete');
