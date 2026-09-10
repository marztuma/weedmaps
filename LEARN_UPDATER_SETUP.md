# Automated Learn Content Update System

## Overview

This system automatically updates your Learn section every Saturday at 8 PM UTC with new, SEO-optimized articles. New articles are queued with release dates and automatically published on schedule.

## What It Does

1. **Scheduled Updates**: Runs cron job every Saturday evening
2. **Auto-Publication**: Releases queued articles on their scheduled dates
3. **Content Management**: Tracks pending articles with release dates
4. **Monitoring**: Provides dashboard to check update status and manually trigger

## Files Created

```
lib/learn/content-updater.js          - Core update logic
app/api/cron/update-learn.js          - Cron endpoint (triggered weekly)
app/api/cron/learn-status.js          - Status monitoring API
app/admin/learn-updater/page.jsx      - Admin dashboard
vercel.json                            - Cron schedule configuration
```

## Setup (5 minutes)

### Step 1: Set Environment Variable

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a random secure string (e.g., `sk_live_abc123xyz...`)
   - Leave other fields as default
3. Click **Add**

### Step 2: Deploy

```bash
git push
# Vercel auto-deploys, or manually deploy if needed
```

### Step 3: Verify It Works

1. Go to `https://yourdomain.com/admin/learn-updater`
2. You should see:
   - Total articles count
   - Next scheduled update (Saturday 8 PM UTC)
   - Option to manually trigger update
3. Save this URL—you'll check it weekly

## How It Works

### Cron Schedule

**File**: `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/update-learn",
    "schedule": "0 20 * * 6"
  }]
}
```

- **0 20 \* \* 6** = Every Saturday at 8 PM UTC
- Cron runs automatically—no action needed

### Article Release Dates

**File**: `lib/learn/content-updater.js`

Articles in `PENDING_ARTICLES` array have `releaseDate` fields:

```javascript
{
  slug: "article-slug",
  title: "Article Title",
  releaseDate: "2026-10-15",  // YYYY-MM-DD format
  sections: [...]
}
```

When cron runs, any article with a `releaseDate` ≤ today is published.

### Adding New Articles

1. **Edit** `lib/learn/content-updater.js`
2. **Add** your article to `PENDING_ARTICLES` array with:
   - `slug`, `title`, `deck`, `mins`, `sections`
   - `releaseDate` (YYYY-MM-DD when it should go live)
3. **Commit and push**—the article will publish automatically on its date

Example:

```javascript
{
  slug: "cannabis-anxiety-guide",
  title: "Cannabis for Anxiety: Safe Dosing Guide",
  deck: "Evidence-based guidance for using cannabis for anxiety.",
  mins: 10,
  releaseDate: "2026-12-01",
  sections: [
    {
      h: "Why cannabis affects anxiety differently",
      p: ["Paragraph 1", "Paragraph 2"]
    },
    // ... more sections
  ]
}
```

## Monitoring

### Check Update Status

- **URL**: `https://yourdomain.com/api/cron/learn-status`
- **What it shows**:
  - Total articles
  - Average read time
  - All article titles and sections
  - Next scheduled update time

### Check Admin Dashboard

- **URL**: `https://yourdomain.com/admin/learn-updater` (login required)
- **Features**:
  - Article count and stats
  - Next update countdown
  - Manual trigger button
  - Article health check

### Manual Trigger (Testing)

1. Go to `/admin/learn-updater`
2. Click **Trigger Manual Update**
3. Enter your `CRON_SECRET` when prompted
4. See immediate result (articles added, if any)

## Queued Articles (Q4 2026)

The system ships with 2 pre-queued articles:

### 1. Quality Indicators Guide
- **Release Date**: October 15, 2026
- **Title**: How to Identify Premium Cannabis
- **Topics**: Trichomes, color, aroma, moisture, COA reading
- **SEO Value**: High (quality indicators, cannabis QA)

### 2. Cannabis for Sleep
- **Release Date**: November 1, 2026
- **Title**: Cannabis for Better Sleep: Dosing Guide
- **Topics**: Sleep science, dosing, strains, hygiene
- **SEO Value**: High (sleep + cannabis, wellness)

Add more by editing `lib/learn/content-updater.js`.

## Troubleshooting

### Cron Not Running

**Check**: Vercel deployment includes `vercel.json`

```bash
git log --oneline | grep -i "vercel.json" || echo "Not deployed"
```

**Fix**: Commit and push `vercel.json`, then redeploy.

### Articles Not Publishing

**Check**: Article `releaseDate` is today or earlier (format: YYYY-MM-DD)

```javascript
// Wrong: "Oct 15, 2026"
// Right: "2026-10-15"
```

**Check**: Article not already in `data/learn.json` (duplicates skip)

### Manual Trigger Says "Unauthorized"

**Fix**: Wrong `CRON_SECRET` or not set in Vercel environment

1. Go to Vercel Dashboard → Environment Variables
2. Confirm `CRON_SECRET` is set
3. Use that exact value in the prompt

## Configuration

### Change Update Time

Edit `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/update-learn",
    "schedule": "0 22 * * 6"  // 10 PM UTC instead
  }]
}
```

Cron format: `minute hour day month dayOfWeek`

- `0 20 * * 6` = Saturday 8 PM UTC (default)
- `0 21 * * 6` = Saturday 9 PM UTC
- `0 22 * * 6` = Saturday 10 PM UTC
- `0 20 * * 0` = Sunday 8 PM UTC

### Disable Automatic Updates

Comment out in `vercel.json`:

```json
{
  "crons": [
    // {
    //   "path": "/api/cron/update-learn",
    //   "schedule": "0 20 * * 6"
    // }
  ]
}
```

## FAQ

**Q: Will articles be published at exact time?**
A: Vercel runs crons within a few minutes of scheduled time. Not guaranteed to the second.

**Q: Can I queue articles for future dates?**
A: Yes. Add them to `PENDING_ARTICLES` with a future `releaseDate`. They'll publish automatically.

**Q: What if I delete an article manually?**
A: It stays deleted. The system only adds new articles; it doesn't restore deleted ones.

**Q: Can I change article content after it's published?**
A: Yes. Edit in `data/learn.json` directly or re-add to `PENDING_ARTICLES` with updated content.

**Q: Does the cron cost extra?**
A: No. Vercel crons are included with Hobby and Pro plans.

**Q: How do I know if the update worked?**
A: Check `/admin/learn-updater` after Saturday 8 PM UTC. If article count increased, it worked.

## Maintenance

**Weekly Check** (5 min)
- Visit `/admin/learn-updater`
- Confirm article count
- Note next update date

**Monthly Review** (15 min)
- Add new articles to `PENDING_ARTICLES`
- Check `/api/cron/learn-status` for content health
- Plan next batch of releases

**Quarterly Content Planning** (1 hour)
- Identify high-SEO topics
- Write article copy
- Set release dates staggered across 3 months
- Queue in `PENDING_ARTICLES`

## Support

If updates stop working:

1. Check `vercel.json` is deployed
2. Verify `CRON_SECRET` in environment variables
3. Try manual trigger from `/admin/learn-updater`
4. Check Vercel deployment logs for errors
5. Confirm `data/learn.json` is readable/writable

## What's Next

**Phase 1** (Done)
- ✓ Articles 1-4 added manually
- ✓ Cron system deployed
- ✓ Admin dashboard created

**Phase 2** (Q4 2026)
- Articles 5-8 publish automatically (queued)
- Monitor performance
- Refine based on analytics

**Phase 3** (Q1 2027)
- Add interactive tools (dosing calculator, strain finder)
- Implement user comments/feedback
- Link articles to relevant products
