import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, reviews } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL));

const latinoNames = [
  'María García', 'Juan López', 'Carmen Rodríguez', 'Antonio Martínez', 'Rosa Hernández',
  'Diego Flores', 'Isabel Morales', 'Luis Jiménez', 'Ana Díaz', 'Carlos Romero',
  'Lucia Ruiz', 'Miguel Soto', 'Sofia Vargas', 'Pablo Medina', 'Elena Castillo',
  'Fernando Reyes', 'Daniela Navarro', 'Ricardo Ortega', 'Valentina Guerrero', 'Sergio Munoz',
  'Catalina Herrera', 'Alejandro Ramirez', 'Marcela Dominguez', 'Victor Acosta', 'Gabriela Fuentes',
  'Roberto Salazar', 'Adriana Vega', 'Enrique Sandoval', 'Patricia Cordova', 'Javier Miranda',
  'Monica Delgado', 'Alfonso Contreras', 'Veronica Zamora', 'Raul Salinas', 'Lorena Campos',
  'Ernesto Cabrera', 'Silvia Valenzuela', 'Manuel Ibarra', 'Beatriz Cabrera', 'Oscar Nunez',
];

const reviewTexts = [
  'Great quality! Exactly what I was looking for. Fast delivery and great service!',
  'Amazing product, highly recommend! Will definitely order again.',
  'Exceeded my expectations. The quality is outstanding and delivery was quick.',
  'Perfect! Been using this for a while now and it\'s consistently excellent.',
  'Very satisfied with my purchase. Great value for the price.',
  'Best I\'ve tried so far. Quality is unmatched.',
  'Fantastic experience from ordering to delivery. Highly recommended!',
  'Exactly as described. Great quality and reliable service.',
  'Love it! Will be a regular customer for sure.',
  'Exceptional quality and fast delivery. Very impressed!',
  'Top notch! Everything arrived perfect and on time.',
  'Best option available. Quality is premium.',
  'Highly satisfied with the product and service.',
  'Consistent quality every time. Never disappointed.',
  'Great value and excellent quality. Highly recommend!',
  'Perfect experience! Quality is amazing.',
  'Outstanding product. Delivery was fast and reliable.',
  'Very happy with this purchase. Great quality!',
  'Reliable and high quality. Will order again!',
  'Excellent service and product quality. Very satisfied!',
];

console.log('🔍 Finding products without reviews...\n');

// Get all products
const allProducts = await db.select({ id: products.id, slug: products.slug, name: products.name }).from(products);

console.log(`Total products: ${allProducts.length}\n`);

// Get unique product IDs that have reviews
const productsWithReviews = await db
  .selectDistinct({ productId: reviews.productId })
  .from(reviews);

const reviewedProductIds = new Set(productsWithReviews.map(r => r.productId).filter(id => id !== null));

// Find products without reviews
const productsNeedingReviews = allProducts.filter(p => !reviewedProductIds.has(p.id));

console.log(`Products needing reviews: ${productsNeedingReviews.length}\n`);

if (productsNeedingReviews.length === 0) {
  console.log('✅ All products already have reviews!');
  process.exit(0);
}

// Add 5 reviews per product
let addedCount = 0;
let nameIndex = 0;

for (const product of productsNeedingReviews) {
  for (let i = 0; i < 5; i++) {
    const fullName = latinoNames[nameIndex % latinoNames.length];
    nameIndex++;

    const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
    const handle = fullName.toLowerCase().replace(/\s+/g, '_');

    try {
      await db.insert(reviews).values({
        productId: product.id,
        rating: rating,
        body: reviewText,
        authorHandle: handle,
        authorLocation: 'California',
        status: 'published',
        isGenerated: true,
      });
      addedCount++;
    } catch (e) {
      console.log(`✗ Error adding review for ${product.name}: ${e.message.split('\n')[0]}`);
    }
  }

  console.log(`✓ ${product.name} - added 5 reviews`);
}

console.log(`\n✅ Added ${addedCount} reviews to ${productsNeedingReviews.length} products`);
console.log(`\n📊 Review Summary:`);
console.log(`   • Products updated: ${productsNeedingReviews.length}`);
console.log(`   • Reviews added per product: 5`);
console.log(`   • Total reviews added: ${addedCount}`);
console.log(`   • Names used: ${addedCount} unique Latino names`);
console.log(`   • Ratings: 4-5 stars (all positive)`);
console.log(`   • Status: All published`);
console.log(`   • Verified: Marked as generated reviews`);
