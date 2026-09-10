# Chatwoot Setup Guide

**Chatwoot** is a free, open-source customer engagement platform. This guide will get you up and running in 15 minutes.

---

## ✅ Requirements

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed ([Get Docker Compose](https://docs.docker.com/compose/install/))
- A domain (optional, but recommended for production)

**Check if you have them:**
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start (15 minutes)

### **Step 1: Run Setup Script**

On macOS/Linux:
```bash
chmod +x setup-chatwoot.sh
./setup-chatwoot.sh
```

On Windows (PowerShell):
```powershell
docker-compose up -d
docker-compose exec chatwoot bundle exec rake db:create
docker-compose exec chatwoot bundle exec rake db:migrate
docker-compose exec chatwoot bundle exec rake db:seed_fu
```

### **Step 2: Create Admin User**

```bash
docker-compose exec chatwoot bundle exec rake admin:create_user
```

Follow the prompts to create your admin account.

### **Step 3: Access Chatwoot**

Open your browser and go to:
```
http://localhost:3000
```

Login with the admin account you just created.

---

## 🔧 Configuration

### **Update Environment Variables**

Edit `.env.chatwoot`:

```bash
# Database (change password from default!)
DB_PASSWORD=your_secure_password_here

# Your domain (change for production)
FRONTEND_URL=http://localhost:3000

# Email sending (optional, but recommended)
MAILER_SENDER_EMAIL=support@weedmap.store
MAILER_SENDER_NAME=Weedmaps Support

# SMTP settings (uncomment and fill in to enable emails)
# SMTP_ADDRESS=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
```

After editing, restart Chatwoot:
```bash
docker-compose restart chatwoot chatwoot_sidekiq
```

---

## 📞 Add Website Channel (Connect to Your Site)

1. **Login to Chatwoot** (http://localhost:3000)
2. Go to **Settings → Channels**
3. Click **+ Add Channel** → **Website**
4. Fill in:
   - **Channel Name**: `Weedmaps Support`
   - **Channel Domain**: Your website domain
5. Click **Create**
6. Copy the **Embed Code** (looks like: `window.chatwootSettings = {...}`)

---

## 🔗 Integrate into Your Website

### **Add Chatwoot to Your Next.js App**

Edit `app/layout.jsx` or `app/(shop)/layout.jsx`:

```jsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ... other head content ... */}
      </head>
      <body>
        {children}

        {/* Chatwoot Widget */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.chatwootSettings = {
                position: "right",
                locale: "en",
              };
              (function(d, w) {
                if (w.ChwBubble) return;
                var s = document.createElement("script");
                s.type = "module";
                s.async = true;
                s.src = "http://localhost:3000/packs/js/sdk.js";
                document.head.appendChild(s);
              }(document, window));
            `,
          }}
        />
      </body>
    </html>
  );
}
```

**Replace `http://localhost:3000` with your Chatwoot URL:**
- Local: `http://localhost:3000`
- Production: `https://chatwoot.weedmap.store`

---

## 📊 Key Features

### **What You Get**

✅ **Unified Inbox** - Chat, email, and more in one place
✅ **Multi-Agent Support** - Add team members to handle chats
✅ **Canned Responses** - Quick replies to common questions
✅ **Customer Profiles** - See history of each customer
✅ **Chat Widget** - Embed on your site (no code needed)
✅ **Auto-Assignment** - Route chats to specific agents
✅ **Labels & Tags** - Organize conversations
✅ **Reports** - Track response times and satisfaction

---

## 🚀 Production Deployment

### **Option 1: Self-Hosted on Your Server**

**Cost**: $5-20/month for server

1. Get a VPS:
   - DigitalOcean ($5/month)
   - Linode ($5/month)
   - Vultr ($5/month)

2. SSH into your server:
   ```bash
   ssh root@your-server-ip
   ```

3. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. Clone this repo:
   ```bash
   git clone https://github.com/marztuma/weedmaps.git
   cd weedmaps
   ```

5. Setup Chatwoot:
   ```bash
   chmod +x setup-chatwoot.sh
   ./setup-chatwoot.sh
   ```

6. Setup SSL with Let's Encrypt:
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot certonly --standalone -d chatwoot.weedmap.store
   ```

7. Use Nginx as reverse proxy:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name chatwoot.weedmap.store;

       ssl_certificate /etc/letsencrypt/live/chatwoot.weedmap.store/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/chatwoot.weedmap.store/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### **Option 2: Cloud Deployment**

Use **Railway.app** (easiest):
1. Go to https://railway.app
2. Connect GitHub → Deploy `chatwoot/chatwoot`
3. Add Postgres database
4. Add Redis
5. Done! (~$5-20/month)

---

## 🛠️ Common Commands

```bash
# Start Chatwoot
docker-compose up -d

# Stop Chatwoot
docker-compose down

# View logs
docker-compose logs -f chatwoot

# Access database
docker-compose exec postgres psql -U chatwoot -d chatwoot

# Create admin user
docker-compose exec chatwoot bundle exec rake admin:create_user

# Restart services
docker-compose restart

# Update to latest version
docker-compose pull
docker-compose up -d
```

---

## 📱 Add Team Members

1. Login to Chatwoot
2. Go to **Settings → Team**
3. Click **+ Add Agent**
4. Enter email and select role:
   - **Administrator** - Full access
   - **Agent** - Handle chats only
5. Send them the login link

---

## 🔒 Security Tips

1. **Change default password** immediately
2. **Use strong DB password** in `.env.chatwoot`
3. **Enable SSL/HTTPS** in production
4. **Regular backups** of Postgres database
5. **Keep Docker images updated**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## 📞 Support

- **Chatwoot Docs**: https://docs.chatwoot.com
- **GitHub Issues**: https://github.com/chatwoot/chatwoot/issues
- **Community**: https://discord.gg/chatwoot

---

## 🎯 Next Steps

1. ✅ Run setup script
2. ✅ Create admin user
3. ✅ Login and explore
4. ✅ Add website channel
5. ✅ Integrate embed code
6. ✅ Add team members
7. ✅ Configure email (optional)
8. ✅ Deploy to production

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Chatwoot | FREE | Open source, forever free |
| VPS (DigitalOcean) | $5/month | For self-hosting |
| Domain | $10/year | Optional |
| Email (SendGrid) | FREE (100/day) | For sending emails |
| **TOTAL** | **$5-20/month** | Scale as you grow |

**No per-message charges. No per-agent fees. Just pay for your server.**

---

Enjoy your new customer support system! 🎉
