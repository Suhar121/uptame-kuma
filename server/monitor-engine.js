import net from 'net';
import { getSystemDrives, getSystemCpu, getSystemMemory } from './system-metrics.js';
import { loadMonitors, saveMonitors } from './storage.js';
import { triggerAlert } from './notifications.js';

class MonitorEngine {
  constructor() {
    this.monitors = loadMonitors();
    this.wsClients = new Set();
    this.intervals = new Map();
  }

  setWsClients(clients) {
    this.wsClients = clients;
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    for (const client of this.wsClients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  start() {
    console.log(`Starting monitoring engine for ${this.monitors.length} monitors...`);
    for (const monitor of this.monitors) {
      if (monitor.active) {
        this.scheduleMonitor(monitor);
      }
    }
  }

  scheduleMonitor(monitor) {
    if (this.intervals.has(monitor.id)) {
      clearInterval(this.intervals.get(monitor.id));
    }

    const intervalMs = (monitor.interval || 30) * 1000;
    
    // Run an initial check after a brief stagger
    setTimeout(() => this.runCheck(monitor.id), Math.random() * 3000 + 1000);

    const timer = setInterval(() => {
      this.runCheck(monitor.id);
    }, intervalMs);

    this.intervals.set(monitor.id, timer);
  }

  async runCheck(monitorId) {
    const monitor = this.monitors.find(m => m.id === monitorId);
    if (!monitor || !monitor.active) return;

    const startTime = Date.now();
    let status = 'down';
    let ping = 0;
    let msg = '';
    let lastError = null;

    try {
      if (monitor.type === 'http') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(monitor.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'UptimeKuma-Integrated/1.0' }
        });
        clearTimeout(timeout);
        ping = Date.now() - startTime;

        if (res.ok) {
          status = 'up';
          msg = `${res.status} ${res.statusText}`;
        } else {
          status = 'down';
          msg = `HTTP Error ${res.status}`;
          lastError = `[${monitor.name}] [DOWN] HTTP status ${res.status} at ${monitor.url}`;
        }
      } else if (monitor.type === 'port') {
        const parts = monitor.url.split(':');
        const host = parts[0];
        const port = parseInt(parts[1], 10) || 80;

        await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout(4000);
          socket.connect(port, host, () => {
            ping = Date.now() - startTime;
            status = 'up';
            msg = `Port ${port} open`;
            socket.destroy();
            resolve();
          });
          socket.on('error', (err) => {
            lastError = `[${monitor.name}] [DOWN] ${err.message}`;
            socket.destroy();
            reject(err);
          });
          socket.on('timeout', () => {
            lastError = `[${monitor.name}] [DOWN] Connection timed out`;
            socket.destroy();
            reject(new Error('Timeout'));
          });
        });
      } else if (monitor.type === 'disk') {
        const drives = await getSystemDrives();
        const targetMount = (monitor.target || 'C:').toUpperCase();
        const drive = drives.find(d => d.mount.toUpperCase().startsWith(targetMount)) || drives[0];

        if (drive) {
          ping = Math.round(drive.usePercent);
          const threshold = monitor.threshold || 90;
          if (drive.usePercent >= threshold) {
            status = 'down';
            msg = `High Disk Usage: ${drive.usePercent}% >= ${threshold}%`;
            lastError = `[${monitor.name}] [DOWN] Disk ${drive.mount} at ${drive.usePercent}% (Threshold ${threshold}%)`;
          } else {
            status = 'up';
            msg = `Disk ${drive.mount}: ${drive.usePercent}% used`;
          }
        }
      } else if (monitor.type === 'memory') {
        const mem = await getSystemMemory();
        ping = Math.round(mem.usedPercent);
        const threshold = monitor.threshold || 90;
        if (mem.usedPercent >= threshold) {
          status = 'down';
          msg = `High Memory Usage: ${mem.usedPercent}% >= ${threshold}%`;
          lastError = `[${monitor.name}] [DOWN] RAM at ${mem.usedPercent}% (Threshold ${threshold}%)`;
        } else {
          status = 'up';
          msg = `RAM: ${mem.usedPercent}% used`;
        }
      } else if (monitor.type === 'cpu') {
        const cpu = await getSystemCpu();
        ping = Math.round(cpu);
        const threshold = monitor.threshold || 90;
        if (cpu >= threshold) {
          status = 'down';
          msg = `High CPU Usage: ${cpu}% >= ${threshold}%`;
          lastError = `[${monitor.name}] [DOWN] CPU at ${cpu}% (Threshold ${threshold}%)`;
        } else {
          status = 'up';
          msg = `CPU: ${cpu}% load`;
        }
      }
    } catch (err) {
      status = 'down';
      ping = 0;
      msg = err.message || 'Check failed';
      lastError = `[${monitor.name}] [DOWN] ${err.message || 'Connection refused'}`;
    }

    // Append heartbeat
    const heartbeat = {
      time: Date.now(),
      status,
      ping,
      msg
    };

    if (!monitor.heartbeats) monitor.heartbeats = [];
    monitor.heartbeats.push(heartbeat);
    if (monitor.heartbeats.length > 50) {
      monitor.heartbeats.shift();
    }

    // Check if status changed and trigger alert
    const previousStatus = monitor.status;
    if (previousStatus && previousStatus !== 'pending' && previousStatus !== status) {
      triggerAlert(monitor, status, previousStatus, lastError || msg);
    }

    // Update statistics
    monitor.status = status;
    monitor.lastPing = ping;
    if (lastError) monitor.lastError = lastError;

    // Calculate Uptime
    const totalChecks = monitor.heartbeats.length;
    const upChecks = monitor.heartbeats.filter(h => h.status === 'up').length;
    monitor.uptime24h = Math.round((upChecks / totalChecks) * 10000) / 100;
    monitor.uptime30d = monitor.uptime24h;
    monitor.uptime1y = monitor.uptime24h;

    // Calculate Average Ping
    const validPings = monitor.heartbeats.filter(h => h.status === 'up' && h.ping > 0).map(h => h.ping);
    if (validPings.length > 0) {
      const sum = validPings.reduce((a, b) => a + b, 0);
      monitor.avgPing = Math.round((sum / validPings.length) * 100) / 100;
    }

    saveMonitors(this.monitors);
    this.broadcast('HEARTBEAT', { monitorId: monitor.id, heartbeat, monitor });
  }

  getMonitors() {
    return this.monitors;
  }

  addMonitor(data) {
    const newId = Date.now().toString();
    const newMonitor = {
      id: newId,
      name: data.name || 'New Monitor',
      tag: data.tag || data.name,
      type: data.type || 'http',
      url: data.url || '',
      target: data.target || 'C:',
      threshold: Number(data.threshold) || 90,
      interval: Number(data.interval) || 50,
      active: true,
      heartbeats: [],
      status: 'pending',
      lastPing: 0,
      avgPing: 0,
      uptime24h: 100,
      uptime30d: 100,
      uptime1y: 100,
      lastError: null
    };

    this.monitors.push(newMonitor);
    saveMonitors(this.monitors);
    this.scheduleMonitor(newMonitor);
    this.broadcast('MONITOR_ADDED', newMonitor);
    return newMonitor;
  }

  deleteMonitor(id) {
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
      this.intervals.delete(id);
    }
    this.monitors = this.monitors.filter(m => m.id !== id);
    saveMonitors(this.monitors);
    this.broadcast('MONITOR_DELETED', { id });
  }

  togglePause(id) {
    const monitor = this.monitors.find(m => m.id === id);
    if (!monitor) return null;
    monitor.active = !monitor.active;
    if (monitor.active) {
      this.scheduleMonitor(monitor);
    } else {
      if (this.intervals.has(id)) {
        clearInterval(this.intervals.get(id));
        this.intervals.delete(id);
      }
      monitor.status = 'paused';
    }
    saveMonitors(this.monitors);
    this.broadcast('MONITOR_UPDATED', monitor);
    return monitor;
  }

  clearData(id) {
    const monitor = this.monitors.find(m => m.id === id);
    if (monitor) {
      monitor.heartbeats = [];
      monitor.lastError = null;
      monitor.uptime24h = 100;
      saveMonitors(this.monitors);
      this.broadcast('MONITOR_UPDATED', monitor);
    }
  }
}

export const monitorEngine = new MonitorEngine();
