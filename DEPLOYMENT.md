# Deployment Guide: Running on Another Machine

This guide explains how to install, run, and maintain this application on any other machine (Ubuntu, Debian, CentOS, macOS, or Windows).

---

## Architecture & Database

- **Database Engine**: **SQLite** via `better-sqlite3` with Write-Ahead Logging (`WAL` mode).
- **Storage Location**: `data/kuma.db`
  - Zero external database services (PostgreSQL, MySQL, etc.) required.
  - All monitors, heartbeats, users, settings, and status pages reside in this single file.
  - **To backup or migrate to another machine**: Simply copy the `data/kuma.db` file!

---

## Method 1: Docker / Docker Compose (Recommended)

Works on any Linux VPS, macOS, or Windows machine without needing Node.js installed on the host.

### Prerequisites
- Docker & Docker Compose installed.

### Steps
1. Transfer or clone the repository to the new machine:
   ```bash
   git clone https://github.com/Suhar121/uptame-kuma.git
   cd uptame-kuma
   ```
2. Start the container in background:
   ```bash
   docker compose up -d --build
   ```
3. Open your browser:
   ```
   http://<machine-ip>:3001
   ```

To stop:
```bash
docker compose down
```

To view logs:
```bash
docker compose logs -f
```

---

## Method 2: Node.js (Bare Metal / VPS / Cloud Server)

### Prerequisites
- Node.js 20+ or 22+ (`node -v`)
- npm (`npm -v`)

### Steps

#### 1. Clone or Copy the Files
```bash
git clone https://github.com/Suhar121/uptame-kuma.git
cd uptame-kuma
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Build the Frontend Assets
```bash
npm run build
```

#### 4. Start the Production Server
```bash
npm start
```
The application will launch on port `3001` (or your configured `PORT` environment variable).

---

## Method 3: Keep Running 24/7 with PM2 (Production VPS)

To keep the application running continuously across server restarts and terminal disconnects:

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Start with PM2
```bash
pm2 start server/index.js --name "uptame-kuma"
```

### 3. Save PM2 Process List and Enable Auto-Startup on Boot
```bash
pm2 save
pm2 startup
```

### Useful PM2 Commands
- View logs: `pm2 logs uptame-kuma`
- Check status: `pm2 status`
- Restart app: `pm2 restart uptame-kuma`
- Stop app: `pm2 stop uptame-kuma`

---

## Method 4: Systemd Service (Linux Ubuntu / Debian)

If you prefer standard Linux systemd services:

1. Create a service file:
   ```bash
   sudo nano /etc/systemd/system/uptame-kuma.service
   ```

2. Paste the following configuration (replace `/path/to/app` and `youruser` with your actual path and user):
   ```ini
   [Unit]
   Description=Uptame Kuma Monitoring Service
   After=network.target

   [Service]
   Type=simple
   User=youruser
   WorkingDirectory=/path/to/uptame-kuma
   ExecStart=/usr/bin/node server/index.js
   Restart=on-failure
   Environment=NODE_ENV=production
   Environment=PORT=3001

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable uptame-kuma
   sudo systemctl start uptame-kuma
   ```

4. Check status:
   ```bash
   sudo systemctl status uptame-kuma
   ```

---

## Backup & Data Migration

All persistent data (monitors, historical heartbeats, telegram configuration, users, status page) is saved in:
```
data/kuma.db
```

### To Backup:
```bash
cp data/kuma.db ~/backup-kuma-$(date +%F).db
```

### To Restore on a New Machine:
Simply place your `kuma.db` inside the `data/` folder on the new machine before starting the application. It will immediately load all your monitors and settings!
