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

// Get all products
const allProducts = await db.select().from(products);

// Get all available images grouped by category
const result = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'weedmaps',
  max_results: 500,
});

const imagesByCategory = {};
result.resources.forEach(r => {
  const parts = r.public_id.split('/');
  const cat = parts[1];
  const name = parts[2];
  if (!imagesByCategory[cat]) imagesByCategory[cat] = [];
  imagesByCategory[cat].push(r.public_id);
});

// Score-based matching
function scoreMatch(productName, imageName) {
  const pLower = productName.toLowerCase();
  const iLower = imageName.toLowerCase();

  let score = 0;

  // Exact substring matches
  if (iLower.includes(pLower.split(' ')[0])) score += 100;
  if (iLower.includes(pLower.split(' ')[1] || '')) score += 50;

  // Common keywords
  const keywords = {
    'blue dream': 'blue',
    'animal face': 'animal|face',
    'biscotti': 'biscotti',
    'jealousy': 'jealousy',
    'cereal milk': 'cereal',
    'lemon': 'lemon',
    'blueberry': 'blueberr',
    'strawberry': 'strawberr',
    'wedding cake': 'wedding',
    'wedding cake': 'cake',
    'gushers': 'gush',
    'zkittlez': 'zkittlez|zkittles',
    'runtz': 'runtz',
  };

  for (const [keyword] of Object.entries(keywords)) {
    if (pLower.includes(keyword) && iLower.includes(keyword)) {
      score += 30;
    }
  }

  return score;
}

// Product to category mapping
const categoryMap = {
  'flower': ['Flower'],
  'vape': ['Vape pens'],
  'edibles': ['Edibles'],
};

// Get product category names
const prodsByCategory = {};
allProducts.forEach(p => {
  if (!prodsByCategory[p.categoryId]) prodsByCategory[p.categoryId] = [];
  prodsByCategory[p.categoryId].push(p);
});

console.log('Smart-matching products to images...\n');

let updated = 0;

for (const [catId, prods] of Object.entries(prodsByCategory)) {
  const cat = prods[0]?.category || '?';
  const catLower = cat.toLowerCase().replace(' ', '_');

  // Get available images for this category
  let categoryImages = imagesByCategory[catLower] || [];

  // Fallback to related categories
  if (categoryImages.length === 0 && catLower === 'edibles') {
    categoryImages = (imagesByCategory['edibles'] || []).concat(
      imagesByCategory['beverages'] || []
    );
  }

  if (categoryImages.length === 0) continue;

  console.log(`Processing ${prods.length} products in ${cat}...`);

  for (const prod of prods) {
    // Skip if already has a good image
    if (prod.imageCloudId && prod.imageCloudId !== 'weedmaps/vape/pr-x-biscotti') {
      continue;
    }

    // Find best matching image
    let bestScore = -1;
    let bestImage = categoryImages[0];

    for (const img of categoryImages) {
      const score = scoreMatch(prod.name, img);
      if (score > bestScore) {
        bestScore = score;
        bestImage = img;
      }
    }

    if (bestImage !== prod.imageCloudId && bestScore > 0) {
      await db.update(products)
        .set({ imageCloudId: bestImage })
        .where(eq(products.id, prod.id));

      updated++;
      console.log(`  ✓ ${prod.name} → ${bestImage.split('/').pop()}`);
    }
  }
}

console.log(`\n✓ Smart-matched ${updated} products`);
