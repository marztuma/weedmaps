# Database Optimization Setup Guide

## ✅ Complete Setup (Follow in Order)

---

## STEP 1: Run Initial Cleanup (5 minutes)

**Option A: Via Neon Console (Easiest)**
1. Go to https://console.neon.tech
2. Select your database
3. Click "SQL Editor"
4. Copy & paste from `scripts/cleanup-neon-db.sql`
5. Run the query
6. Check the results

**Option B: Via Command Line**
```bash
psql $DATABASE_URL < scripts/cleanup-neon-db.sql
```

**Expected Results:**
- ✅ Removes ~30-40% of database size
- ✅ Keeps all critical data (products, orders, customers)
- ✅ Saves $0-15/month on Neon costs

---

## STEP 2: Set Up Auto-Cleanup (Vercel Cron)

This runs automatically on the 1st of every month at 2 AM

### A. Add CRON_SECRET to Vercel
1. Go to https://vercel.com/dashboard/weed-maps
2. Settings → Environment Variables
3. Add new variable:
   - Name: `CRON_SECRET`
   - Value: (generate random string) `your-secret-key-here-12345`
4. Save for all environments

### B. Add Cron Job to vercel.json
```json
{
  "crons": [{
    "path": "/api/admin/cleanup-db",
    "schedule": "0 2 1 * *"
  }]
}
```

Create/update `vercel.json` in root:
```bash
cat > vercel.json << 'EOF'
{
  "crons": [{
    "path": "/api/admin/cleanup-db",
    "schedule": "0 2 1 * *"
  }]
}
EOF
```

### C. Deploy
```bash
git add vercel.json app/api/admin/cleanup-db/route.js
git commit -m "Add database auto-cleanup cron job"
git push origin main
```

---

## STEP 3: Disable Page View Tracking (Optional - Saves More)

### Why?
- Page views are the biggest space hog (20-30% of database)
- Vercel Web Analytics is better and free
- We can still use Vercel analytics dashboard

### How to Disable:
1. Stop collecting page views - Comment out tracking code
2. Keep analytics dashboard using Vercel's data instead

**File to update:** `lib/track-analytics.js` (if exists)
- Remove or comment out page_views insert

---

## STEP 4: Enable Vercel Web Analytics (Free Alternative)

### A. In Your App
Add to root layout:
```jsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### B. View Analytics
- Go to https://vercel.com/dashboard/weed-maps
- Click "Analytics" tab
- See all page views, user flow, etc.
- **Zero database cost!**

---

## STEP 5: Monitor Database Size Weekly

### Via Neon Console
1. Go to https://console.neon.tech
2. Select database
3. Storage section shows current size
4. Should see 30-40% reduction after cleanup

### Via SQL Query
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## 📊 Expected Savings

| Action | Savings | When |
|--------|---------|------|
| Initial cleanup | 30-40% | **Now** |
| Auto monthly cleanup | +5-10% | 1st of month |
| Disable page tracking | +20-30% | After setup |
| **Total** | **50-60%** | **This week** |

---

## 💾 Database Size Timeline

```
BEFORE:  ~3-5 GB  → $15/month (Neon paid tier)
AFTER:   ~1.5-2 GB → $0/month (Free tier or less)
```

---

## 🔔 Monitoring

### Weekly Check
```sql
-- Run this query weekly
SELECT 
  'database_size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
  'page_views_count',
  COUNT(*)::text
FROM page_views
UNION ALL
SELECT 
  'audit_logs_count',
  COUNT(*)::text
FROM audit_log;
```

### Alerts
- Set Vercel alert if database > 2GB
- Email if monthly cleanup fails

---

## ✅ Checklist

- [ ] Run cleanup SQL script
- [ ] Add CRON_SECRET to Vercel environment
- [ ] Add vercel.json with cron job
- [ ] Deploy to production
- [ ] Add Vercel Analytics to layout
- [ ] Verify analytics dashboard works
- [ ] Monitor database size
- [ ] Set up weekly size check

---

## 📞 Issues?

**Cleanup failed?**
- Check Neon permissions
- Verify DATABASE_URL is correct
- Try smaller date ranges first

**Cron not running?**
- Verify CRON_SECRET matches
- Check Vercel cron logs
- Test endpoint manually: `/api/admin/cleanup-db?secret=your-secret`

**Analytics missing?**
- Vercel Analytics shows in dashboard
- Might take 24 hours to populate
- Check Vercel settings → Analytics enabled

---

## Files Created

✅ `scripts/cleanup-neon-db.sql` - One-time cleanup script  
✅ `app/api/admin/cleanup-db/route.js` - Automated monthly cleanup  
✅ `vercel.json` - Cron configuration (add this file)  

Ready to deploy! 🚀
