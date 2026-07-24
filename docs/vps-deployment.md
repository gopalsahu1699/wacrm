# Hostinger VPS 2 – Deployment Guide

Complete step-by-step guide to self-hosting wacrm on Hostinger VPS 2
with **PM2**, **Nginx**, **SSL (Certbot)**, and **system cron** for automations.

---

## Prerequisites

- Hostinger VPS 2 (Ubuntu 22.04 or 24.04 recommended)
- A domain pointed to your VPS IP (A record)
- SSH access to the VPS

---

## 1 — Connect to VPS & Install Node.js

```bash
ssh root@YOUR_VPS_IP

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify
node -v   # should be v20.x.x
npm -v

# Install PM2 globally (keeps the app alive after crashes / reboots)
npm install -g pm2
```

---

## 2 — Install Nginx & Certbot (SSL)

```bash
apt-get install -y nginx certbot python3-certbot-nginx
```

---

## 3 — Upload Your Code

**Option A — Git (recommended)**
```bash
cd /var/www
git clone https://github.com/YOUR_FORK/wacrm.git
cd wacrm
npm install
```

**Option B — rsync from your local machine (run on your Windows machine)**
```powershell
# In PowerShell on your dev machine:
rsync -avz --exclude node_modules --exclude .next `
  "d:/web software developement/wacrm2/wacrm/" `
  root@YOUR_VPS_IP:/var/www/wacrm/
```

---

## 4 — Create the Environment File

```bash
cd /var/www/wacrm
cp .env.local.example .env.local
nano .env.local
```

Fill in every required value:

```env
# ── Required ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 64 hex chars — generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your-64-char-hex-key

META_APP_SECRET=your-meta-app-secret

# Your VPS domain
NEXT_PUBLIC_SITE_URL=https://crm.yourdomain.com

# ── Automation cron (NEW — generate a strong random string) ─
# Used by the system cron job to authenticate to /api/automations/cron
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTOMATION_CRON_SECRET=your-random-cron-secret
```

---

## 5 — Build the App

```bash
cd /var/www/wacrm
npm run build
```

> **Expected:** `.next/` directory created. Takes ~60–120s.

---

## 6 — Start with PM2

```bash
cd /var/www/wacrm

# Start the app on port 3000
pm2 start npm --name "wacrm" -- start -- --port 3000

# Auto-restart PM2 on VPS reboot
pm2 startup
# Run the command that pm2 outputs (it looks like: sudo env PATH=... pm2 startup)
pm2 save
```

Verify the app is running:
```bash
pm2 status
curl http://localhost:3000   # should return HTML
```

---

## 7 — Configure Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/wacrm
```

Paste this configuration (replace `crm.yourdomain.com`):

```nginx
server {
    listen 80;
    server_name crm.yourdomain.com;

    # Increase body size limit for media uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Allow long-running webhook processing (automations can take time)
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
        proxy_send_timeout 120s;
    }
}
```

Enable and test:
```bash
ln -s /etc/nginx/sites-available/wacrm /etc/nginx/sites-enabled/
nginx -t          # should say "syntax is ok"
systemctl reload nginx
```

---

## 8 — Enable SSL (HTTPS)

```bash
certbot --nginx -d crm.yourdomain.com
# Follow the prompts — choose "Redirect HTTP to HTTPS"
```

Certbot auto-renews every 90 days. Test renewal:
```bash
certbot renew --dry-run
```

---

## 9 — Set Up System Cron for Automations ⚡

This is the **key fix** for automations. On VPS, you use Linux's built-in cron
instead of Vercel Cron — unlimited frequency, completely free.

```bash
crontab -e
```

Add these lines at the bottom (runs every **5 minutes**):

```cron
# Drain pending automation wait-steps every 5 minutes
*/5 * * * * curl -s -X GET \
  "https://crm.yourdomain.com/api/automations/cron" \
  -H "x-cron-secret: YOUR_AUTOMATION_CRON_SECRET" \
  >> /var/log/wacrm-automations-cron.log 2>&1

# Sweep timed-out flow runs every 5 minutes
*/5 * * * * curl -s -X GET \
  "https://crm.yourdomain.com/api/flows/cron" \
  -H "x-cron-secret: YOUR_AUTOMATION_CRON_SECRET" \
  >> /var/log/wacrm-flows-cron.log 2>&1
```

> Replace `YOUR_AUTOMATION_CRON_SECRET` with the value you set in `.env.local`.

Test the cron endpoint manually:
```bash
curl -v "https://crm.yourdomain.com/api/automations/cron" \
  -H "x-cron-secret: YOUR_AUTOMATION_CRON_SECRET"
# Expected: {"processed":0}  (or a number if there are pending executions)
```

---

## 10 — Update Meta Webhook URL

In **Meta for Developers → WhatsApp → Configuration**, update your webhook URL to:

```
https://crm.yourdomain.com/api/whatsapp/webhook
```

---

## 11 — Useful Commands

| Command | Purpose |
|---|---|
| `pm2 status` | See app status |
| `pm2 logs wacrm` | View live logs |
| `pm2 restart wacrm` | Restart after code change |
| `pm2 reload wacrm` | Zero-downtime reload |
| `pm2 monit` | CPU/memory dashboard |
| `nginx -t && systemctl reload nginx` | Reload Nginx config |
| `cat /var/log/wacrm-automations-cron.log` | Check cron logs |

---

## 12 — Deploy Updates

```bash
cd /var/www/wacrm
git pull                  # or re-upload via rsync
npm install               # in case dependencies changed
npm run build
pm2 reload wacrm          # zero-downtime reload
```

---

## Troubleshooting

### Automations still not running?
1. Check the cron job is actually running: `cat /var/log/wacrm-automations-cron.log`
2. Verify the secret matches: the value in `crontab -e` must exactly match `AUTOMATION_CRON_SECRET` in `.env.local`
3. Check PM2 logs for engine errors: `pm2 logs wacrm --lines 200`

### App won't start?
```bash
pm2 logs wacrm   # check for missing env vars or build errors
```

### Nginx 502 Bad Gateway?
The app isn't running on port 3000. Check:
```bash
pm2 status        # app should be "online"
curl http://localhost:3000   # should return HTML
```
