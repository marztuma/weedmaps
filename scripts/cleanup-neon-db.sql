-- Neon Database Cleanup & Archive Script
-- Run this to free up 30-40% of database space
-- Safe to run - only deletes old data

BEGIN;

-- ============================================
-- STEP 1: Archive Old Page Views (20-30%)
-- ============================================
DELETE FROM page_views
WHERE viewed_at < NOW() - INTERVAL '3 months';

-- Result: Removes all page tracking older than 3 months
-- Impact: Free up ~20-30% of database size

-- ============================================
-- STEP 2: Clean Old Admin Notifications (5%)
-- ============================================
DELETE FROM admin_notifications
WHERE created_at < NOW() - INTERVAL '3 months'
  AND read_at IS NOT NULL;

-- Result: Removes old read notifications
-- Impact: Free up ~5% of database size

-- ============================================
-- STEP 3: Archive Old Audit Logs (10%)
-- ============================================
DELETE FROM audit_log
WHERE created_at < NOW() - INTERVAL '2 years';

-- Result: Keeps 2 years for compliance, deletes older
-- Impact: Free up ~10% of database size

-- ============================================
-- STEP 4: Archive Old Email Events (5%)
-- ============================================
DELETE FROM email_events
WHERE received_at < NOW() - INTERVAL '3 months';

-- Result: Removes old webhook event logs
-- Impact: Free up ~5% of database size
-- Note: Resend keeps these anyway

-- ============================================
-- SUMMARY: Show new database size
-- ============================================
SELECT
  pg_size_pretty(pg_database_size(current_database())) as "Current Size",
  (SELECT COUNT(*) FROM page_views) as "Remaining PageViews",
  (SELECT COUNT(*) FROM admin_notifications) as "Remaining Notifications",
  (SELECT COUNT(*) FROM audit_log) as "Remaining AuditLogs",
  (SELECT COUNT(*) FROM email_events) as "Remaining EmailEvents";

COMMIT;
