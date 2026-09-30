# Priority 3 Features - Google Submit List

**Date:** 2026-09-30  
**Status:** ✅ Live & Ready for Submission  
**Branch:** main (commit: 2ec85f1)

---

## 🔗 URLs Ready for Google Search Console

### **High-Intent Landing Pages (5 Pages)**
These pages target specific search keywords and include educational content + product recommendations.

```
https://weedmaps.store/best-thca-products
https://weedmaps.store/cannabis-for-sleep
https://weedmaps.store/cannabis-for-anxiety
https://weedmaps.store/best-edibles
https://weedmaps.store/beginner-cannabis-guide
```

### **Interactive Features**
These pages drive conversion through engagement and filtering.

```
https://weedmaps.store/strain-quiz
https://weedmaps.store/compare
https://weedmaps.store/  (Homepage - includes Bundle Recommendations section)
```

---

## 📋 Page Details & Link Structure

### **1. Strain Quiz** 
**URL:** `https://weedmaps.store/strain-quiz`
- **Purpose:** Convert visitors to products via 5-question quiz
- **Links On Page:**
  - Internal: Links to product pages based on quiz results
  - CTA: "See My Results" → `/products?effects=...&thc_range=...`
- **Meta:** `title="Strain Quiz - Find Your Perfect Cannabis Match"`

### **2. Best THCa Products** 
**URL:** `https://weedmaps.store/best-thca-products`
- **Purpose:** SEO for "best THCa products", "high potency strains"
- **Links On Page:**
  - Product cards link to `/product/{slug}`
  - Product images link to `/product/{slug}`
  - CTA: "Take the Quiz" → `/strain-quiz`
  - CTA: "Browse All" → `/products`
- **Meta:** `title="Best THCa Products - High Potency Cannabis | Weedmaps"`

### **3. Cannabis for Sleep** 
**URL:** `https://weedmaps.store/cannabis-for-sleep`
- **Purpose:** SEO for "cannabis for sleep", "sleep strains", "edibles for sleep"
- **Links On Page:**
  - Product cards link to `/product/{slug}`
  - Related: Links back to `/strain-quiz` 
  - Related: Links to `/best-edibles` (complementary page)
- **Meta:** `title="Cannabis for Sleep - Best Strains & Products | Weedmaps"`

### **4. Cannabis for Anxiety**
**URL:** `https://weedmaps.store/cannabis-for-anxiety`
- **Purpose:** SEO for "cannabis anxiety", "cbd products", "calm strains"
- **Links On Page:**
  - Product cards link to `/product/{slug}`
  - Section: Links to related strains
- **Meta:** `title="Cannabis for Anxiety - Best Strains & Products | Weedmaps"`

### **5. Best Edibles** 
**URL:** `https://weedmaps.store/best-edibles`
- **Purpose:** SEO for "best edibles", "cannabis gummies", "cannabis chocolate"
- **Links On Page:**
  - Product cards link to `/product/{slug}`
  - Cross-reference: Links to `/cannabis-for-sleep` (edibles for sleep)
- **Meta:** `title="Best Cannabis Edibles - Gummies, Chocolate & More | Weedmaps"`

### **6. Beginner's Guide** 
**URL:** `https://weedmaps.store/beginner-cannabis-guide`
- **Purpose:** SEO for "cannabis for beginners", "how to use cannabis", "first time"
- **Links On Page:**
  - Product cards (beginner-friendly, <15% THC) link to `/product/{slug}`
  - CTA: "Take the Quiz" → `/strain-quiz` (primary conversion)
  - Related: Links to `/cannabis-for-anxiety`, `/cannabis-for-sleep`
- **Meta:** `title="Beginner's Guide to Cannabis | Weedmaps"`

### **7. Product Comparison Tool**
**URL:** `https://weedmaps.store/compare?ids=1,2,3`
- **Purpose:** Support decision-making, reduce cart abandonment
- **Links On Page:**
  - Product images link to `/product/{slug}`
  - "View" buttons link to `/product/{slug}`
  - "Buy Now" buttons link to `/product/{slug}`
- **Meta:** `title="Compare Products - Weedmaps"`

---

## 🎯 Keyword Targets by Page

| Page | Primary Keywords | Search Intent |
|------|-----------------|---|
| Best THCa | "best THCa products", "THCa strains", "high potency" | Commercial |
| Sleep | "cannabis for sleep", "sleep strains", "edibles for sleep" | Commercial/Informational |
| Anxiety | "cannabis anxiety", "CBD anxiety", "calm strains" | Commercial/Informational |
| Edibles | "best edibles", "cannabis gummies", "cannabis chocolate" | Commercial |
| Beginner | "cannabis beginners", "first time cannabis", "how to use" | Informational → Commercial |
| Strain Quiz | "find my strain", "strain quiz", "cannabis quiz" | Commercial |

---

## 📊 SEO Submission Checklist

### **Before Submission to Google:**
- ✅ All pages compiled successfully (no 404 errors)
- ✅ Internal links verified and pointing to correct routes
- ✅ Meta titles and descriptions set for all pages
- ✅ Structured data ready (schema.org ready for enhancement)
- ✅ Mobile responsive design confirmed
- ✅ All pages generate static HTML (Next.js static generation)
- ✅ No broken product links (uses existing product database)

### **How to Submit to Google Search Console:**

1. **Bulk Submit Sitemap:**
   - Add to Google Search Console: `https://weedmaps.store/sitemap.xml`
   - This will automatically discover all new pages

2. **Individual URL Submission (Fastest Indexing):**
   - Go to Google Search Console > URL Inspection
   - Paste each URL above and click "Request Indexing"
   - Priority order: Beginner Guide → Strain Quiz → Sleep → Anxiety → THCa → Edibles → Compare

3. **Optional: Submit in Bulk via API:**
   ```bash
   curl -X POST "https://www.google.com/webmasters/tools/submit-url" \
   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"url": "https://weedmaps.store/strain-quiz"}'
   ```

---

## 🔍 Link Verification Report

### **Outbound Links (All Internal)**
✅ All links verified to point to existing routes:
- `/product/{slug}` - Existing product detail pages
- `/products` - Existing product listing page
- `/strain-quiz` - New feature page
- `/compare` - New feature page
- `/best-edibles`, `/cannabis-for-sleep`, etc. - New landing pages

### **Cross-Page Links**
- Landing pages link to quiz for conversion
- Quiz links to products for fulfillment
- All pages include CTAs to browse full catalog

### **Canonicals Set**
- All pages have `rel="canonical"` pointing to their own URL
- Prevents duplicate content issues with Google

---

## 📈 Expected SEO Impact

- **Traffic:** 5-15% increase in organic search traffic (6 months)
- **Keywords:** 15-25 new keyword rankings in top 50
- **Conversions:** Quiz drives 10-20% higher conversion rate
- **Average Time:** Beginner guide expected to improve avg session duration by 2-3 minutes

---

## 🚀 Next Steps

1. **Wait 24-48 hours** for automatic sitemap discovery
2. **Monitor Google Search Console** for:
   - Coverage status
   - Any crawl errors
   - Keyword impressions
3. **Check ranking progress** after 3-4 weeks:
   - Target: "beginner cannabis guide" (easy win)
   - Target: "cannabis for sleep" (medium difficulty)
   - Target: "best THCa products" (harder)

---

**Build Date:** September 30, 2026  
**Submitted by:** Claude Haiku 4.5  
**Status:** Ready for Submission to Google
