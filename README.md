# Uptime Kuma + Integrated Host & Disk Monitoring

A lightweight, real-time service and host monitoring platform combining **Uptime Kuma's signature UI & UX** with **native system resource & disk capacity diagnostics**.

![Uptime Kuma Dark UI](https://img.shields.io/badge/UI-Uptime%20Kuma%20Style-22c55e)
![Host Monitoring](https://img.shields.io/badge/Hardware-Disk%20%7C%20CPU%20%7C%20RAM-3b82f6)
![Node](https://img.shields.io/badge/Node-v22-green)

---

## Features

### 1. Pixel-Accurate Uptime Kuma UI / UX
* **Signature Dark Aesthetic:** Deep slate/charcoal palette (`#0c1322`), mint green status accents (`#22c55e`), and alert banners (`#ef4444`).
* **Heartbeat Bar Strip:** Segmented vertical pill bars tracking 35-minute uptime intervals with live updates.
* **5 Metric Overview Tiles:** Current Response, 24-hour Average, and 24-hour / 30-day / 1-year Uptime percentages.
* **Interactive Chart with Downtime Shading:** Smooth response curve with semi-transparent red vertical highlight bands during outage periods.
* **Incident Alert Toast:** Real-time floating error notices with dismiss controls.
* **Public & Private Status Pages:** Dedicated overview page with operational component badges and status summaries.

### 2. Native Host & Disk Monitoring (No Secondary Daemons Needed)
* **Disk Space Monitoring:** Automatically scans system partitions (`C:`, `D:`, `/`, `/mnt`) and tracks real-time capacity and free space.
* **Threshold-Based Outages:** Configurable alert threshold (e.g. alert as DOWN if disk usage exceeds 90%).
* **CPU & Memory Telemetry:** Native load metrics recorded directly on the latency timeline.

### 3. Network & Service Monitoring
* **HTTP / HTTPS:** Status code checks, latency measurements, and connectivity verification.
* **TCP Ports:** Socket probing for databases and custom daemons.

---

## Getting Started

### 1. Installation
```bash
npm install
npm run build
```

### 2. Start the Application
Run the unified server (serves the dashboard and API on port `3001`):
```bash
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

### 3. Development Mode
To run Vite with hot-module replacement alongside the backend:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)**.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/monitors` | List all monitors and recent heartbeats |
| `POST` | `/api/monitors` | Create a new monitor (HTTP, Port, Disk, CPU, Memory) |
| `DELETE` | `/api/monitors/:id` | Delete a monitor |
| `POST` | `/api/monitors/:id/pause` | Pause or resume a monitor |
| `POST` | `/api/monitors/:id/clear` | Clear heartbeat history |
| `GET` | `/api/system/drives` | List local drives and disk utilization |
| `GET` | `/api/system/overview` | Host system summary (OS, CPU, RAM, Drives) |
| `WS` | `/ws` | Real-time WebSocket event stream |
