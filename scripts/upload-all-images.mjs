import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, '../public/products');

// Get all uploaded images from Cloudinary
const result = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'weedmaps',
  max_results: 500,
});

const uploadedIds = new Set(result.resources.map(r => r.public_id));

// Find all local images
const localImages = {};
const categories = fs.readdirSync(baseDir);

categories.forEach(cat => {
  const catPath = path.join(baseDir, cat);
  if (!fs.statSync(catPath).isDirectory()) return;

  const files = fs.readdirSync(catPath);
  const seen = new Set();

  files.forEach(file => {
    if (!file.endsWith('.avif')) return;
    const name = file.replace('.avif', '');
    if (seen.has(name)) return;
    seen.add(name);

    const cloudId = `weedmaps/${cat}/${name}`;
    if (!localImages[cat]) localImages[cat] = [];
    localImages[cat].push({
      name,
      cloudId,
      filePath: path.join(catPath, file),
      uploaded: uploadedIds.has(cloudId),
    });
  });
});

// Count what needs uploading
let toUpload = 0;
Object.values(localImages).forEach(imgs => {
  toUpload += imgs.filter(i => !i.uploaded).length;
});

console.log(`\nLocal images found: ${Object.values(localImages).flat().length}`);
console.log(`Already uploaded: ${Object.values(localImages).flat().filter(i => i.uploaded).length}`);
console.log(`Need to upload: ${toUpload}\n`);

if (toUpload === 0) {
  console.log('All images already uploaded!');
  process.exit(0);
}

// Upload missing images
let uploadedCount = 0;
for (const [cat, images] of Object.entries(localImages)) {
  const toUploadInCat = images.filter(i => !i.uploaded);
  if (toUploadInCat.length === 0) continue;

  console.log(`\nUploading ${cat} (${toUploadInCat.length} images):`);

  for (const img of toUploadInCat) {
    try {
      await cloudinary.uploader.upload(img.filePath, {
        public_id: img.cloudId.replace('weedmaps/', ''),
        folder: 'weedmaps',
        resource_type: 'auto',
      });
      uploadedCount++;
      if (uploadedCount % 10 === 0) {
        console.log(`  uploaded ${uploadedCount}/${toUpload}…`);
      }
    } catch (err) {
      console.error(`Failed to upload ${img.name}:`, err.message);
    }
  }
}

console.log(`\n✓ Total uploaded: ${uploadedCount}/${toUpload}`);
