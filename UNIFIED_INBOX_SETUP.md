# Unified Inbox Setup Guide

Build a **Chat + Email + SMS inbox** all in one place. No Docker. No cloud costs. Just email and SMS services.

---

## 🎯 **What You're Getting**

✅ **Unified Admin Dashboard** (`/admin/inbox`)
- View all messages from Chat, Email, SMS in one place
- Filter by channel
- Quick reply buttons
- Real-time updates

✅ **Chat Integration** (Already working)
- `/admin/chat` — View and reply to chat messages

✅ **Email Integration** (Gmail API)
- Receive emails to `support@weedmap.store`
- Reply directly from admin panel
- Sync with Gmail

✅ **SMS Integration** (Twilio)
- Receive customer texts on your Twilio number
- Reply instantly from admin
- Free tier available

---

## 📋 **Setup Steps (30 minutes total)**

### **Part 1: Email Setup (Gmail API) - 10 min**

**Step 1: Create Google Cloud Project**

1. Go to: https://console.cloud.google.com
2. Click "Select a Project" → "NEW PROJECT"
3. Name it: `Weedmaps Support`
4. Click Create

**Step 2: Enable Gmail API**

1. In Google Cloud Console, search for "Gmail API"
2. Click "Gmail API"
3. Click "ENABLE"

**Step 3: Create OAuth Credentials**

1. Go to "Credentials" (left sidebar)
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Choose "Desktop application"
4. Name it: `Weedmaps Admin`
5. Click Create
6. Download the JSON file
7. Copy and save these values:
   - `client_id`
   - `client_secret`

**Step 4: Get Refresh Token**

For now, use this URL to authorize:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/api/auth/gmail/callback&
  response_type=code&
  scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/gmail.send&
  access_type=offline
```

You'll get a code to exchange for a refresh token.

---

### **Part 2: SMS Setup (Twilio) - 10 min**

**Step 1: Create Twilio Account**

1. Go to: https://www.twilio.com/console
2. Sign up (free trial)
3. Verify your phone number

**Step 2: Get Credentials**

In Twilio Dashboard, copy:
- **Account SID**
- **Auth Token**

**Step 3: Get a Phone Number**

1. Go to "Phone Numbers" → "Manage" → "Buy a Number"
2. Search for any number
3. Buy it (free trial includes $15 credit)
4. Copy the phone number (e.g., `+12025551234`)

---

### **Part 3: Add to Your App - 10 min**

**Step 1: Install Dependencies**

```bash
npm install googleapis twilio dotenv
```

**Step 2: Create `.env.local`**

```env
# Gmail API
GMAIL_CLIENT_ID=your-client-id-here
GMAIL_CLIENT_SECRET=your-client-secret-here
GMAIL_REFRESH_TOKEN=your-refresh-token-here

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12025551234
```

**Step 3: Database Setup**

You need to add a table for inbox messages. Add this to your schema:

```javascript
export const inboxMessages = pgTable("inbox_messages", {
  id: serial("id").primaryKey(),
  channel: varchar("channel", { length: 16 }).notNull(), // chat, email, sms
  from: varchar("from", { length: 254 }).notNull(),
  to: varchar("to", { length: 254 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("received"), // received, sent
  externalId: varchar("external_id", { length: 255 }).unique(), // Gmail/Twilio ID
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  channelIdx: index("inbox_channel_idx").on(t.channel),
  fromIdx: index("inbox_from_idx").on(t.from),
}));
```

Run migration:
```bash
npx drizzle-kit push
```

---

## 🚀 **Access Your Unified Inbox**

Once setup is complete:

1. Go to: `http://localhost:3000/admin/inbox`
2. You'll see three boxes:
   - ✅ **Chat** — Already working
   - ⚙️ **Email** — Setup required (click to configure)
   - ⚙️ **SMS** — Setup required (click to configure)

3. Below is a unified table showing all messages from all channels

---

## 💻 **How It Works**

### **Incoming Chat**
1. User opens chat on site
2. Types message
3. Appears in `/admin/inbox` instantly
4. Admin clicks "Reply"
5. Goes to `/admin/chat`
6. Admin replies
7. User sees response

### **Incoming Email**
1. Customer sends email to `support@weedmap.store`
2. Gmail API syncs email
3. Appears in `/admin/inbox` under Email channel
4. Admin clicks "Reply"
5. Modal opens to reply
6. Admin writes response
7. Email sent via Gmail API

### **Incoming SMS**
1. Customer texts your Twilio number
2. Twilio webhook receives message
3. Stored in database
4. Appears in `/admin/inbox` under SMS channel
5. Admin clicks "Reply"
6. SMS sent via Twilio
7. Customer gets text immediately

---

## 📞 **Enable SMS Receiving (Webhook)**

To receive incoming SMS, configure Twilio webhook:

1. Go to Twilio Console → Phone Numbers
2. Click your number
3. Under "Messaging", set "Webhook URL" to:
   ```
   https://yourdomain.com/api/webhooks/twilio/sms
   ```
4. Save

Your app will automatically handle incoming SMS at that endpoint.

---

## 💰 **Cost Breakdown**

| Service | Cost | Notes |
|---------|------|-------|
| Gmail API | FREE | Unlimited emails |
| Twilio SMS | $0.0075 per SMS | Free trial: $15 credit (~2000 SMS) |
| **TOTAL** | **~$0-5/month** | Way cheaper than competitors |

---

## 🔧 **API Endpoints Created**

- `GET /api/admin/inbox/messages` — Fetch all messages from all channels
- `POST /api/webhooks/twilio/sms` — Receive incoming SMS
- `POST /api/auth/gmail/callback` — Gmail OAuth callback

---

## ✅ **Your Unified Inbox Features**

✅ View all messages (Chat + Email + SMS) in one dashboard
✅ Filter by channel
✅ See who sent what, when
✅ Click "Reply" to respond
✅ Auto-refresh every 10 seconds
✅ No per-message charges
✅ No monthly subscription fees
✅ Full control over your data

---

## 🚨 **Troubleshooting**

### **Gmail emails not showing**
- Verify `GMAIL_REFRESH_TOKEN` is set correctly
- Check email is reaching your inbox
- Try re-authorizing Gmail

### **SMS not received**
- Verify Twilio webhook URL is correct
- Check Twilio phone number is active
- Make sure webhook URL is public (not localhost)

### **Unified inbox shows nothing**
- Check messages exist in database
- Verify API credentials are correct
- Check browser console for errors

---

## 📚 **Next Steps**

1. ✅ Install dependencies (`npm install googleapis twilio`)
2. ✅ Set up Gmail API (get credentials)
3. ✅ Set up Twilio (get phone number)
4. ✅ Add `.env.local` variables
5. ✅ Add inbox_messages table to schema
6. ✅ Run migration
7. ✅ Visit `/admin/inbox`
8. ✅ Test each channel

---

**Your unified support inbox is ready! No Docker. No cloud deployment. Just email + SMS + chat.** 🎉
