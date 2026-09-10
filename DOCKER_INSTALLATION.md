# Docker Installation Guide for Windows

Since Docker is not installed yet, follow these steps to get Docker running on your Windows system.

---

## 🔧 **Step 1: Install Docker Desktop for Windows**

### **Download Docker Desktop**

1. Go to: https://www.docker.com/products/docker-desktop
2. Click **"Download for Windows"**
3. Choose one:
   - **Docker Desktop for Windows (AMD64)** — Most common
   - **Docker Desktop for Windows (ARM64)** — If you have Apple Silicon Mac (M1/M2)

### **Install Docker Desktop**

1. **Run the installer** (e.g., `Docker Desktop Installer.exe`)
2. **Follow the installation wizard**:
   - Accept the license
   - Choose installation location
   - Enable "Use WSL 2 instead of Hyper-V" (recommended for Windows)
   - Click Install
3. **Wait for installation** (~5-10 minutes)
4. **Restart your computer** when prompted

### **Verify Installation**

Open **PowerShell** and run:
```powershell
docker --version
docker-compose --version
```

You should see something like:
```
Docker version 24.0.0, build abcdef1
Docker Compose version v2.20.0
```

---

## ✅ **Step 2: Verify Docker is Running**

Docker Desktop runs as a background service. Make sure it's started:

1. **Look for Docker icon in system tray** (bottom right)
2. If you see a whale icon 🐋, Docker is running
3. If not, open **Docker Desktop** application

---

## 🚀 **Step 3: Run Chatwoot Setup**

Once Docker is installed and running:

### **Open PowerShell**
```powershell
cd "C:\Users\HPX360~1\OneDrive\Desktop\mitchees' disto"
```

### **Create .env file from template**
```powershell
Copy-Item .env.chatwoot.example .env.chatwoot
```

### **Start Chatwoot**
```powershell
docker-compose up -d
```

### **Wait for services to start** (2-3 minutes)
```powershell
docker-compose ps
```

You should see:
```
CONTAINER ID  IMAGE                      STATUS
abc123...     postgres:15-alpine         Up 2 minutes
def456...     redis:7-alpine             Up 2 minutes
ghi789...     chatwoot/chatwoot:latest   Up 1 minute
```

### **Setup database**
```powershell
docker-compose exec chatwoot bundle exec rake db:create
docker-compose exec chatwoot bundle exec rake db:migrate
docker-compose exec chatwoot bundle exec rake db:seed_fu
```

### **Create admin user**
```powershell
docker-compose exec chatwoot bundle exec rake admin:create_user
```

Follow the prompts to create your admin account.

### **Access Chatwoot**

Open your browser:
```
http://localhost:3000
```

Login with the admin account you just created.

---

## 🛠️ **Troubleshooting**

### **Docker won't start**
- Make sure Docker Desktop is running (check system tray)
- Try restarting Docker Desktop
- Check Windows updates (Docker requires recent Windows 10/11)

### **Port 3000 already in use**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### **Database connection error**
```powershell
# Restart all services
docker-compose down
docker-compose up -d
docker-compose logs -f chatwoot
```

### **Out of memory**
Docker might not have enough resources. Increase Docker's memory:
1. Open Docker Desktop
2. Settings → Resources
3. Increase Memory to at least 4GB
4. Restart Docker

---

## 📊 **Verify Chatwoot is Running**

### **Check container logs**
```powershell
docker-compose logs -f chatwoot
```

You should see:
```
chatwoot_1    | * Listening on tcp://0.0.0.0:3000
chatwoot_1    | Use Ctrl-C to stop
```

### **Test the connection**
```powershell
# Should return HTTP 200
curl http://localhost:3000
```

---

## ⚙️ **Useful Commands**

```powershell
# Start Chatwoot
docker-compose up -d

# Stop Chatwoot
docker-compose down

# View logs (live)
docker-compose logs -f chatwoot

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart all services
docker-compose restart

# Check status
docker-compose ps

# Access database
docker-compose exec postgres psql -U chatwoot -d chatwoot

# Access Rails console
docker-compose exec chatwoot bundle exec rails console

# Update to latest version
docker-compose pull
docker-compose up -d
```

---

## 🎯 **Next Steps After Setup**

1. ✅ Login to Chatwoot (http://localhost:3000)
2. ✅ Go to Settings → Channels
3. ✅ Click "+ Add Channel" → "Website"
4. ✅ Copy the embed code
5. ✅ Add to your website's `app/layout.jsx`
6. ✅ Test the chat widget on your site

---

## 📞 **Need Help?**

- **Docker Docs**: https://docs.docker.com/
- **Docker Desktop Troubleshooting**: https://docs.docker.com/desktop/troubleshoot/
- **Chatwoot Docs**: https://docs.chatwoot.com/
- **Chatwoot Community**: https://discord.gg/chatwoot

---

## 🎉 **You're Ready!**

Once Docker is installed and Chatwoot is running, you'll have a complete free customer support system ready to go.

**Estimated time**: 30 minutes total
- Docker installation: 15 minutes
- Chatwoot setup: 10 minutes
- Testing: 5 minutes
