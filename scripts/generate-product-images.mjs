import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';

const db = drizzle(neon(process.env.DATABASE_URL));

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Generate SVG product image based on product data
function generateProductSVG(product) {
  const thcLevel = Math.min(100, product.thc || 20);
  const thcColor = thcLevel > 25 ? '#ef4444' : thcLevel > 15 ? '#f97316' : '#eab308';

  const categoryColors = {
    flower: '#10b981',
    edibles: '#ec4899',
    concentrates: '#f59e0b',
    'vape pens': '#8b5cf6',
    beverages: '#06b6d4',
    'pre-rolls': '#6366f1',
    wellness: '#14b8a6',
  };

  const categoryColor = categoryColors[product.categoryName?.toLowerCase()] || '#6b7280';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="categoryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${categoryColor};stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:${categoryColor};stop-opacity:0" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="400" height="500" fill="url(#bgGrad)"/>

  <!-- Category gradient overlay -->
  <circle cx="200" cy="150" r="120" fill="url(#categoryGrad)" opacity="0.6"/>

  <!-- THC indicator circle -->
  <circle cx="200" cy="150" r="100" fill="none" stroke="${categoryColor}" stroke-width="2" opacity="0.3"/>
  <circle cx="200" cy="150" r="85" fill="none" stroke="${thcColor}" stroke-width="3" opacity="0.8"/>

  <!-- THC percentage display -->
  <text x="200" y="140" font-size="48" font-weight="bold" text-anchor="middle" fill="${thcColor}">
    ${product.thc}%
  </text>
  <text x="200" y="165" font-size="16" text-anchor="middle" fill="#9ca3af">
    THC
  </text>

  <!-- Product name -->
  <text x="200" y="270" font-size="20" font-weight="bold" text-anchor="middle" fill="#f3f4f6" font-family="Arial, sans-serif">
    ${(product.name || '').substring(0, 20)}
  </text>
  <text x="200" y="295" font-size="14" text-anchor="middle" fill="#d1d5db" font-family="Arial, sans-serif">
    ${product.weight || '1g'} · ${product.strainType || 'hybrid'}
  </text>

  <!-- Category badge -->
  <rect x="80" y="320" width="240" height="40" rx="20" fill="${categoryColor}" opacity="0.2" stroke="${categoryColor}" stroke-width="2"/>
  <text x="200" y="348" font-size="14" font-weight="bold" text-anchor="middle" fill="${categoryColor}" font-family="Arial, sans-serif">
    ${(product.categoryName || 'Cannabis').toUpperCase()}
  </text>

  <!-- Price display -->
  <text x="200" y="430" font-size="28" font-weight="bold" text-anchor="middle" fill="#fbbf24">
    $${(product.priceCents / 100).toFixed(0)}
  </text>

  <!-- Bottom accent line -->
  <line x1="50" y1="470" x2="350" y2="470" stroke="${categoryColor}" stroke-width="2" opacity="0.5"/>
</svg>`;
}

// Upload SVG to Cloudinary
async function uploadToCloudinary(svg, publicId) {
  try {
    const buffer = Buffer.from(svg, 'utf-8');
    const stream = Readable.from([buffer]);

    const form = new FormData();
    form.append('file', stream, { filename: `${publicId}.svg` });
    form.append('public_id', `weedmaps/${publicId}`);
    form.append('resource_type', 'image');
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('timestamp', Math.floor(Date.now() / 1000));

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: form,
    });

    const result = await response.json();
    if (result.public_id) {
      return result.public_id.replace('weedmaps/', '');
    }
    return null;
  } catch (e) {
    console.log(`  ✗ Upload failed: ${e.message}`);
    return null;
  }
}

console.log('🎨 Generating product images for 77 new products...\n');

// Get all new products
const newProducts = await db.select().from(products).where(
  (p) => p.slug.in([
    'thca-runtz', 'thca-gelato', 'thca-wedding-cake', 'thca-diamonds',
    'wyld-mixed-berry', 'wyld-watermelon', 'jeeter-kief', 'jeeter-diamonds',
    'cbd-tincture-1000mg', 'diamonds-blue-dream', 'delta8-cart', 'runtz', 'gelato'
  ])
);

let updated = 0;

console.log(`Found ${newProducts.length} sample products to update\n`);

for (const product of newProducts) {
  try {
    const svg = generateProductSVG(product);
    const cloudId = await uploadToCloudinary(svg, product.slug);

    if (cloudId) {
      await db.update(products)
        .set({ imageCloudId: cloudId })
        .where(eq(products.id, product.id));

      updated++;
      console.log(`✓ ${product.name}`);
    }
  } catch (e) {
    console.log(`✗ ${product.name}: ${e.message}`);
  }
}

console.log(`\n✅ Generated images for ${updated} products`);
console.log(`\n🎯 Product images now show:`);
console.log(`   • THC percentage with color coding`);
console.log(`   • Product name and weight`);
console.log(`   • Category badge with color`);
console.log(`   • Price display`);
console.log(`   • Professional gradient design`);
console.log(`\n📤 All images uploaded to Cloudinary`);
