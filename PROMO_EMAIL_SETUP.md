# Promotional Email System

Send weekly promotional emails featuring available deals to your subscribers.

## Setup

### 1. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Test subscriber emails (comma-separated for testing)
TEST_SUBSCRIBER_EMAILS=subscriber1@example.com,subscriber2@example.com

# Admin API key for triggering emails via API
ADMIN_API_KEY=your-secret-admin-key
```

### 2. Send Promotional Email

#### Option A: Using the Script (Recommended)

```bash
npm run promo:send
```

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "promo:send": "node scripts/send-promo-email.mjs"
  }
}
```

#### Option B: Using the API Endpoint

**POST** to `/api/email/send-promo`

With authorization header:
```bash
curl -X POST http://localhost:3000/api/email/send-promo \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

**GET** to `/api/email/send-promo` (for testing)

```bash
curl -X GET http://localhost:3000/api/email/send-promo \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

## How It Works

1. **Email Template**: `components/PromoEmail.jsx`
   - React component that renders the email HTML
   - Shows top 6 deals with product images, prices, and savings
   - Includes call-to-action button to shop all deals

2. **API Route**: `app/api/email/send-promo/route.js`
   - Fetches all available deals from database
   - Renders email template
   - Sends via Resend API to subscriber list
   - Returns success/failure status for each email

3. **Script**: `scripts/send-promo-email.mjs`
   - CLI tool to manually send promotional emails
   - Logs detailed progress and results
   - Great for scheduled tasks or cron jobs

## Email Features

✅ Professional HTML email design
✅ Shows top 6 deals with categories
✅ Original and sale prices
✅ Savings percentage highlighted
✅ Category emojis (flower 🌿, edibles 🍬, vape 💨, etc.)
✅ Call-to-action buttons
✅ Mobile-responsive layout
✅ Unsubscribe link in footer

## Customization

### Add Subscriber Database

Currently uses `TEST_SUBSCRIBER_EMAILS`. To use a real subscriber list:

1. Create a subscribers table in your database
2. Update `app/api/email/send-promo/route.js`:

```javascript
// Replace this:
const subscriberEmails = process.env.TEST_SUBSCRIBER_EMAILS?.split(",") || [];

// With this:
const subscribers = await db.select({ email: emailSubscribers.email })
  .from(emailSubscribers)
  .where(eq(emailSubscribers.unsubscribed, false));
const subscriberEmails = subscribers.map(s => s.email);
```

### Customize Email Content

Edit `components/PromoEmail.jsx` to:
- Change colors and branding
- Adjust layout and spacing
- Modify copy and headings
- Add/remove deal cards

## Schedule with Cron

To send emails weekly on Sundays at 9 AM:

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/email/send-promo",
    "schedule": "0 9 * * 0"
  }]
}
```

## Resend Configuration

1. Get API key from https://resend.com
2. Verify sender domain (or use default Resend domain)
3. Set up DKIM for better deliverability
4. Monitor delivery in Resend dashboard

## Troubleshooting

### "Unauthorized" error
- Check ADMIN_API_KEY in .env.local
- Verify Authorization header format: `Bearer YOUR_KEY`

### "Invalid API key"
- Ensure RESEND_API_KEY is set correctly
- Check it's a valid key from resend.com

### Emails not received
- Check spam/junk folder
- Verify sender domain is verified in Resend
- Check delivery logs in Resend dashboard
- Ensure subscriber email is correct

### SMTP/Connection errors
- Verify internet connection
- Check Resend service status
- Ensure API key is active

## Next Steps

1. ✅ Set up Resend account and get API key
2. ✅ Add environment variables
3. ✅ Create subscribers table (optional, for production)
4. ✅ Test with `npm run promo:send`
5. ✅ Schedule with cron job
6. ✅ Monitor delivery and engagement

## API Response

### Success Response

```json
{
  "success": true,
  "message": "Promotional email sent to 150 subscribers",
  "results": [
    {
      "email": "subscriber@example.com",
      "success": true,
      "id": "email_xxxxxxxxxxxx"
    }
  ],
  "dealCount": 42,
  "topDeals": [...]
}
```

### Error Response

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

---

**Questions?** Check Resend docs: https://resend.com/docs
