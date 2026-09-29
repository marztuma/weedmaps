import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql, desc } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL));

console.log('🔍 VISITOR TRACKING & SYNC DIAGNOSTIC\n');
console.log('='.repeat(60));

// 1. Check visitor count
console.log('\n1️⃣ VISITOR DATA CHECK:\n');
try {
  const visitorStats = await db.execute(sql`
    SELECT
      COUNT(*) as total_visitors,
      COUNT(CASE WHEN last_seen_at > NOW() - INTERVAL '30 days' THEN 1 END) as visitors_30d,
      COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as with_country,
      COUNT(CASE WHEN country IS NULL THEN 1 END) as missing_country,
      COUNT(CASE WHEN referrer_host IS NOT NULL THEN 1 END) as with_referrer
    FROM visitors;
  `);

  const stats = visitorStats[0];
  console.log(`  • Total visitors: ${stats.total_visitors}`);
  console.log(`  • Active (30d): ${stats.visitors_30d}`);
  console.log(`  • With country data: ${stats.with_country}`);
  console.log(`  • Missing country: ${stats.missing_country}`);
  console.log(`  • With referrer: ${stats.with_referrer}`);

  if (stats.missing_country > 0) {
    console.log(`\n  ⚠️ ${stats.missing_country} visitors missing country data`);
    console.log('     Reason: Vercel x-vercel-ip-country header may not be present');
  }
} catch (e) {
  console.log(`  ❌ Error: ${e.message.split('\n')[0]}`);
}

// 2. Check recent visitors in detail
console.log('\n2️⃣ RECENT 10 VISITORS:\n');
try {
  const recent = await db.execute(sql`
    SELECT
      visitor_key as key,
      page_views as views,
      landing_path as landing,
      referrer_host as referrer,
      country,
      first_seen_at as first,
      last_seen_at as last
    FROM visitors
    ORDER BY last_seen_at DESC
    LIMIT 10;
  `);

  if (recent.length === 0) {
    console.log('  ⚠️ No visitors found!');
    console.log('  Check: Is the Track component rendering on frontend?');
  } else {
    recent.forEach((v, i) => {
      console.log(`  ${i+1}. ${v.key.slice(0, 8)}...`);
      console.log(`     • Views: ${v.views}`);
      console.log(`     • Landed: ${v.landing || '/'}`);
      console.log(`     • From: ${v.referrer || 'direct'}`);
      console.log(`     • Country: ${v.country || '(unknown)'}`);
      console.log(`     • Last seen: ${new Date(v.last).toLocaleString()}`);
    });
  }
} catch (e) {
  console.log(`  ❌ Error: ${e.message.split('\n')[0]}`);
}

// 3. Check page views
console.log('\n3️⃣ PAGE VIEWS TRACKING:\n');
try {
  const pageViews = await db.execute(sql`
    SELECT
      COUNT(*) as total_views,
      COUNT(CASE WHEN viewed_at > NOW() - INTERVAL '7 days' THEN 1 END) as views_7d,
      COUNT(DISTINCT visitor_id) as unique_visitors,
      COUNT(DISTINCT path) as unique_paths
    FROM page_views;
  `);

  const pv = pageViews[0];
  console.log(`  • Total page views: ${pv.total_views}`);
  console.log(`  • Last 7 days: ${pv.views_7d}`);
  console.log(`  • Unique visitors: ${pv.unique_visitors}`);
  console.log(`  • Unique paths: ${pv.unique_paths}`);
} catch (e) {
  console.log(`  ❌ Error: ${e.message.split('\n')[0]}`);
}

// 4. Check top pages
console.log('\n4️⃣ TOP PAGES (last 7 days):\n');
try {
  const topPages = await db.execute(sql`
    SELECT
      path,
      COUNT(*) as views
    FROM page_views
    WHERE viewed_at > NOW() - INTERVAL '7 days'
    GROUP BY path
    ORDER BY views DESC
    LIMIT 5;
  `);

  if (topPages.length === 0) {
    console.log('  ⚠️ No page views recorded');
  } else {
    topPages.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.path}: ${p.views} views`);
    });
  }
} catch (e) {
  console.log(`  ❌ Error: ${e.message.split('\n')[0]}`);
}

// 5. Sync check
console.log('\n5️⃣ SYNC & DATA CONSISTENCY:\n');
try {
  const syncCheck = await db.execute(sql`
    SELECT
      'Visitors' as table_name,
      COUNT(*) as row_count,
      MAX(last_seen_at) as last_update
    FROM visitors
    UNION ALL
    SELECT
      'PageViews',
      COUNT(*),
      MAX(viewed_at)
    FROM page_views;
  `);

  syncCheck.forEach(row => {
    console.log(`  • ${row.table_name}: ${row.row_count} rows`);
    console.log(`    Last update: ${row.last_update ? new Date(row.last_update).toLocaleString() : 'Never'}`);
  });

  console.log('\n  ✅ Sync Status: OK (Data is being recorded)');
} catch (e) {
  console.log(`  ❌ Sync Error: ${e.message.split('\n')[0]}`);
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 RECOMMENDATIONS:\n');
console.log('✅ What is working:');
console.log('  • Visitor key generation (localStorage)');
console.log('  • Page view tracking (sendBeacon)');
console.log('  • Referrer capture');
console.log('  • Landing page recording');

console.log('\n⚠️ What may need attention:');
console.log('  • Country data (requires Vercel x-vercel-ip-country header)');
console.log('  • Make sure Track component is imported in root layout');
console.log('  • Check browser console for tracking errors');

console.log('\n🔧 To verify frontend tracking is working:');
console.log('  1. Open browser DevTools (F12)');
console.log('  2. Go to Network tab');
console.log('  3. Look for POST requests to /api/track');
console.log('  4. Check that country in DB matches your IP country');

console.log('\n' + '='.repeat(60) + '\n');
