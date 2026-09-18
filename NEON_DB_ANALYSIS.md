# Neon Database Analysis & Optimization

## 📊 Database Size Breakdown

### **CRITICAL TABLES** (Keep - Core Business)
| Table | Purpose | Size Est. | Monthly Cost |
|-------|---------|-----------|--------------|
| `products` | Core inventory (350+ items) | **HIGH** | 🔴 Largest |
| `shops` | Delivery services | Small | ✅ Keep |
| `orders` | Customer orders | Medium | ✅ Keep |
| `customers` | User accounts | Medium | ✅ Keep |
| `categories` | Product categories | Tiny | ✅ Keep |
| `brands` | Brand data | Tiny | ✅ Keep |

**Action:** KEEP - These are your revenue-generating tables

---

### **USEFUL TABLES** (Keep - Feature Support)
| Table | Purpose | Size Est. | Status |
|-------|---------|-----------|--------|
| `subscribers` | Email list | Small | ✅ Keep |
| `campaigns` | Email campaigns | Small | ✅ Keep |
| `emailLog` | Delivery tracking | **GROWING** | ⚠️ Monitor |
| `chatConversations` | Support chat | Small | ✅ Keep |
| `chatMessages` | Chat history | Small | ✅ Keep |
| `reviews` | Product reviews | Medium | ✅ Keep |

**Action:** KEEP - But archive old email logs

---

### **ARCHIVE/CLEANUP CANDIDATES** (Can Reduce)
| Table | Purpose | Size Est. | Recommendation |
|-------|---------|-----------|-----------------|
| `pageViews` | Analytics tracking | **MEDIUM-HIGH** | 🗑️ Archive or Delete |
| `auditLog` | Audit trail | Small-Medium | 🗑️ Archive or Prune |
| `adminNotifications` | Old alerts | Small | 🗑️ Delete old records |
| `emailSuppressions` | Bounce tracking | Tiny | ✅ Keep |
| `emailEvents` | Webhook logs | Small | 🗑️ Archive monthly |
| `customerNotes` | Support notes | Small | ✅ Keep |

**Action:** Archive or delete old records

---

### **OPTIONAL/RARELY USED** (Can Disable)
| Table | Purpose | Size Est. | Recommendation |
|-------|---------|-----------|-----------------|
| `discountCodes` | Promo codes | Tiny | ✅ Keep |
| `discountRedemptions` | Used codes | Tiny | ✅ Keep |
| `orderItems` | Order line items | Medium | ✅ Keep (linked to orders) |
| `paymentMethods` | Payment config | Tiny | ✅ Keep |
| `adminUsers` | Admin accounts | Tiny | ✅ Keep |
| `emailSettings` | Config data | Tiny | ✅ Keep |

**Action:** KEEP - These are config/system tables

---

## 🎯 Immediate Savings Strategy

### **STEP 1: Archive Old Data** (EASIEST - Save 20-30%)
```sql
-- Archive page views older than 3 months
DELETE FROM page_views 
WHERE viewed_at < NOW() - INTERVAL '3 months';

-- Archive email logs older than 6 months
DELETE FROM email_log 
WHERE created_at < NOW() - INTERVAL '6 months';

-- Clean up old audit logs (keep recent)
DELETE FROM audit_log 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Archive old admin notifications
DELETE FROM admin_notifications 
WHERE created_at < NOW() - INTERVAL '3 months'
  AND read_at IS NOT NULL;
```

**Estimated Savings:** 20-30% of database size  
**Risk:** Low (archiving old data)  
**Time:** 5 minutes

---

### **STEP 2: Disable Analytics** (MEDIUM - Save 10-15%)
**Option A: Stop tracking page views**
- Remove `/api/track-page-view` calls from client
- Stop logging page views to database
- Use Vercel Analytics instead (included)

**Option B: Keep but archive aggressively**
- Only keep last 30 days of page views
- Set up monthly cleanup job

**Estimated Savings:** 10-15% ongoing  
**Risk:** Lose historical analytics  
**Alternative:** Use Vercel built-in analytics (free)

---

### **STEP 3: Clean Up Audit Logs** (EASY - Save 5-10%)
```sql
-- Keep only last 1 year
DELETE FROM audit_log 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Then archive monthly
-- Add cron job to delete records > 12 months old
```

**Estimated Savings:** 5-10%  
**Risk:** Low (old audit data rarely needed)  
**Benefit:** Compliance (GDPR 1-year retention)

---

### **STEP 4: Archive Email Events** (EASY - Save 5%)
```sql
-- Keep only recent webhook events
DELETE FROM email_events 
WHERE received_at < NOW() - INTERVAL '3 months';
```

**Estimated Savings:** 5%  
**Risk:** Very low (Resend tracks these too)

---

## 📈 Monthly Usage Estimates

**Current State (No changes):**
- Database: ~2-5GB (depending on products/orders)
- Neon limit: 3GB free tier OR $15/month for unlimited

**After Cleanup:**
- Database: ~1.5-3GB
- Savings: **$0-15/month** (depends on tier)

---

## ✅ RECOMMENDED ACTION PLAN

### **Immediate (This Week):**
1. ✅ Archive page_views older than 3 months (-20%)
2. ✅ Delete admin_notifications older than 3 months (-5%)
3. ✅ Prune audit_log to last 2 years (-10%)
4. ✅ Archive email_events older than 3 months (-5%)

**Total Estimated Savings: 30-40%**

### **Short Term (Next Month):**
5. 📊 Switch to Vercel Analytics (replace page_views)
6. 🤖 Set up monthly cleanup cron job
7. 📧 Archive email_log older than 6 months quarterly

### **Long Term:**
8. 🗂️ Move old order/customer data to archive DB (if 10GB+)
9. 📊 Use data warehouse for analytics (Warehouse DB)

---

## 🔧 Quick Cleanup Script

```bash
# Connect to Neon via CLI
psql $DATABASE_URL << 'EOF'

-- Step 1: Archive analytics (biggest savings)
DELETE FROM page_views 
WHERE viewed_at < NOW() - INTERVAL '3 months';

-- Step 2: Archive old notifications
DELETE FROM admin_notifications 
WHERE created_at < NOW() - INTERVAL '3 months'
  AND read_at IS NOT NULL;

-- Step 3: Prune audit logs
DELETE FROM audit_log 
WHERE created_at < NOW() - INTERVAL '2 years';

-- Step 4: Archive webhook events
DELETE FROM email_events 
WHERE received_at < NOW() - INTERVAL '3 months';

-- Get new size
SELECT pg_size_pretty(pg_database_size(current_database()));

EOF
```

---

## 💰 Cost Summary

| Action | Savings | Effort | Risk |
|--------|---------|--------|------|
| Archive 3-month+ page_views | 20% | ⏱️ 5 min | ✅ Low |
| Delete old notifications | 5% | ⏱️ 1 min | ✅ Low |
| Prune audit logs | 10% | ⏱️ 2 min | ✅ Low |
| Archive email events | 5% | ⏱️ 1 min | ✅ Very Low |
| **TOTAL** | **40%** | **9 min** | **✅ Safe** |

**Potential Savings: $0-15/month** (if on paid Neon tier)

---

## 🚫 DO NOT DELETE

❌ `products` - Revenue generator  
❌ `orders` - Business critical  
❌ `customers` - User data  
❌ `shops` - Delivery services  
❌ `campaigns` - Email history  
❌ `chatMessages` - Support history  
❌ `discountCodes` - Active promos  
❌ `reviews` - Social proof  

---

## Next Steps

1. **Check current Neon plan** at https://console.neon.tech
2. **Run cleanup script** above
3. **Monitor database size** weekly
4. **Set up auto-cleanup** cron jobs for ongoing savings

Ready to run the cleanup? Let me know! 🚀
