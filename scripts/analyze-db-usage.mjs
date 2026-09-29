import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const db = drizzle(neon(process.env.DATABASE_URL));

console.log('🔍 NEON DATABASE ANALYSIS\n');
console.log('=' .repeat(60));

// 1. Check active connections
console.log('\n📊 1. ACTIVE DATABASE CONNECTIONS:\n');
try {
  const connections = await db.execute(sql`
    SELECT
      usename,
      count(*) as connection_count,
      max(now() - backend_start) as oldest_connection
    FROM pg_stat_activity
    WHERE state != 'idle'
    GROUP BY usename
    ORDER BY connection_count DESC;
  `);

  if (connections.length > 0) {
    connections.forEach(conn => {
      console.log(`  • ${conn.usename}: ${conn.connection_count} active connection(s)`);
    });
  } else {
    console.log('  ✓ No active long-running connections');
  }
} catch (e) {
  console.log('  ⚠️ Could not fetch connection info');
}

// 2. Check idle connections
console.log('\n📊 2. IDLE CONNECTIONS (can be closed):\n');
try {
  const idleCount = await db.execute(sql`
    SELECT COUNT(*) as idle_count
    FROM pg_stat_activity
    WHERE state = 'idle' AND pid != pg_backend_pid();
  `);

  console.log(`  • Idle connections: ${idleCount[0]?.idle_count || 0}`);
  console.log('  💡 Recommendation: These connections can be safely closed');
} catch (e) {
  console.log('  ⚠️ Could not fetch idle connection count');
}

// 3. Table sizes
console.log('\n📊 3. TABLE SIZES (space usage):\n');
try {
  const tableSizes = await db.execute(sql`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `);

  let totalBytes = 0;
  tableSizes.forEach(tbl => {
    console.log(`  • ${tbl.tablename}: ${tbl.size}`);
    totalBytes += tbl.bytes;
  });
  console.log(`\n  📈 Total database size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
} catch (e) {
  console.log('  ⚠️ Could not fetch table sizes');
}

// 4. Row counts
console.log('\n📊 4. ROW COUNTS (by table):\n');
try {
  const rowCounts = await db.execute(sql`
    SELECT
      schemaname,
      tablename,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC;
  `);

  rowCounts.forEach(tbl => {
    console.log(`  • ${tbl.tablename}: ${tbl.live_rows} rows` +
      (tbl.dead_rows > 100 ? ` (${tbl.dead_rows} dead rows - should vacuum)` : ''));
  });
} catch (e) {
  console.log('  ⚠️ Could not fetch row counts');
}

// 5. Unused indexes
console.log('\n📊 5. UNUSED INDEXES (can be dropped):\n');
try {
  const unusedIndexes = await db.execute(sql`
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as scans_since_creation
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0 AND indexname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexrelid) DESC;
  `);

  if (unusedIndexes.length > 0) {
    console.log(`  ⚠️ Found ${unusedIndexes.length} unused indexes:\n`);
    unusedIndexes.forEach(idx => {
      console.log(`    - ${idx.indexname} on ${idx.tablename}`);
      console.log(`      💡 Never scanned - can be dropped to save space`);
    });
  } else {
    console.log('  ✓ No unused indexes found');
  }
} catch (e) {
  console.log('  ⚠️ Could not fetch index usage info');
}

// 6. Cache hit ratio
console.log('\n📊 6. DATABASE PERFORMANCE:\n');
try {
  const cacheRatio = await db.execute(sql`
    SELECT
      sum(heap_blks_read) as heap_read,
      sum(heap_blks_hit) as heap_hit,
      sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
    FROM pg_statio_user_tables;
  `);

  const ratio = cacheRatio[0]?.cache_hit_ratio;
  if (ratio) {
    console.log(`  • Cache hit ratio: ${ratio.toFixed(2)}%`);
    if (ratio > 95) {
      console.log('    ✓ Excellent - DB is well optimized');
    } else if (ratio > 80) {
      console.log('    ⚠️ Good - could be better');
    } else {
      console.log('    ⚠️ Poor - consider adding more indexes');
    }
  }
} catch (e) {
  console.log('  ⚠️ Could not fetch cache statistics');
}

// 7. Recommendations
console.log('\n' + '='.repeat(60));
console.log('\n💡 OPTIMIZATION RECOMMENDATIONS FOR FREE TIER:\n');

console.log('✅ KEEP (High Priority):');
console.log('  • products table (core inventory)');
console.log('  • brands, categories, shops (lookup tables)');
console.log('  • orders, orderItems (transaction history)');
console.log('  • reviews (customer trust/SEO)');

console.log('\n⚠️  CAN OPTIMIZE:');
console.log('  1. Close idle connections (not using space but using connections)');
console.log('  2. Drop unused indexes (free up disk space)');
console.log('  3. Vacuum dead rows (reclaim space from deleted data)');
console.log('  4. Archive old orders (if > 6 months old)');

console.log('\n🗑️  CAN SAFELY DELETE (if not needed):');
console.log('  • Old session/cache tables (if any)');
console.log('  • Duplicate/test data');
console.log('  • Migration/seed tables');

console.log('\n' + '='.repeat(60));
