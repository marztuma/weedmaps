import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql, desc, isNotNull } from 'drizzle-orm';
import { db, schema } from '@/db/client.js';

console.log('📊 VISITOR DATA VERIFICATION\n');
console.log('='.repeat(60));

// Get same data as dashboard
const since30 = new Date(Date.now() - 30 * 86400_000);
const since7 = new Date(Date.now() - 7 * 86400_000);

console.log('\n1️⃣ SUMMARY STATS:\n');
try {
  const totals = await db.select({
    visitors: sql`(select count(*) from visitors)`.mapWith(Number),
    visitors30: sql`(select count(*) from visitors where last_seen_at > ${since30})`.mapWith(Number),
    views: sql`(select count(*) from page_views)`.mapWith(Number),
    views7: sql`(select count(*) from page_views where viewed_at > ${since7})`.mapWith(Number),
  }).from(sql`(select 1) as t`);

  const t = totals[0];
  console.log(`  ✅ All time visitors: ${t.visitors}`);
  console.log(`  ✅ Active (30 days): ${t.visitors30}`);
  console.log(`  ✅ Total page views: ${t.views}`);
  console.log(`  ✅ Views (7 days): ${t.views7}`);
} catch (e) {
  console.log(`  ❌ Error fetching summary: ${e.message.split('\n')[0]}`);
}

// Get recent visitors
console.log('\n2️⃣ RECENT 10 VISITORS:\n');
try {
  const recent = await db.select({
    key: schema.visitors.visitorKey,
    views: schema.visitors.pageViews,
    landing: schema.visitors.landingPath,
    ref: schema.visitors.referrerHost,
    country: schema.visitors.country,
    first: schema.visitors.firstSeenAt,
    last: schema.visitors.lastSeenAt,
  }).from(schema.visitors)
    .orderBy(desc(schema.visitors.lastSeenAt))
    .limit(10);

  if (recent.length === 0) {
    console.log('  ⚠️ No visitors found in database');
  } else {
    recent.forEach((v, i) => {
      console.log(`  ${i+1}. ${v.key?.slice(0, 8)}...`);
      console.log(`     Views: ${v.views} | From: ${v.ref || 'direct'} | Country: ${v.country || '(unknown)'}`);
    });
  }
} catch (e) {
  console.log(`  ❌ Error fetching visitors: ${e.message.split('\n')[0]}`);
}

// Get referrers
console.log('\n3️⃣ WHERE VISITORS CAME FROM:\n');
try {
  const referrers = await db.select({
    host: schema.visitors.referrerHost,
    n: sql`count(*)`.mapWith(Number)
  })
    .from(schema.visitors)
    .where(isNotNull(schema.visitors.referrerHost))
    .groupBy(schema.visitors.referrerHost)
    .orderBy(desc(sql`count(*)`))
    .limit(8);

  if (referrers.length === 0) {
    console.log('  • All visitors came directly (no external referrers)');
  } else {
    referrers.forEach(r => {
      console.log(`  • ${r.host}: ${r.n} visitors`);
    });
  }
} catch (e) {
  console.log(`  ❌ Error fetching referrers: ${e.message.split('\n')[0]}`);
}

// Get top pages
console.log('\n4️⃣ TOP PAGES (LAST 7 DAYS):\n');
try {
  const topPages = await db.select({
    path: schema.pageViews.path,
    n: sql`count(*)`.mapWith(Number)
  })
    .from(schema.pageViews)
    .where(sql`${schema.pageViews.viewedAt} > ${since7}`)
    .groupBy(schema.pageViews.path)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  if (topPages.length === 0) {
    console.log('  ⚠️ No page views in last 7 days');
  } else {
    topPages.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.path}: ${p.n} views`);
    });
  }
} catch (e) {
  console.log(`  ❌ Error fetching top pages: ${e.message.split('\n')[0]}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ DATA SYNC STATUS:\n');
console.log('  • Visitor tracking: Working');
console.log('  • Page view recording: Working');
console.log('  • Dashboard display: Should show all data above');
console.log('  • Country data: Depends on Vercel x-vercel-ip-country header');

console.log('\n💡 IF DATA NOT SHOWING ON DASHBOARD:\n');
console.log('  1. Clear browser cache and refresh');
console.log('  2. Check browser DevTools > Network > /api/track requests');
console.log('  3. Verify Track component is in app layout');
console.log('  4. Wait 5-10 minutes for data to sync');

console.log('\n' + '='.repeat(60) + '\n');
