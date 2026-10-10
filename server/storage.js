import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'monitors.json');

// Ensure data folder exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate default monitors matching user screenshot + system monitors
function getDefaultMonitors() {
  const now = Date.now();
  
  // Create realistic historical ticks for "Ops #1" with ~70.45% uptime and recent down state
  const opsHeartbeats = [];
  for (let i = 35; i >= 0; i--) {
    const isDown = (i >= 0 && i <= 8) || (i >= 18 && i <= 21); // Recent down streak and past down streak
    opsHeartbeats.push({
      time: now - i * 50 * 1000,
      status: isDown ? 'down' : 'up',
      ping: isDown ? 0 : Math.round(10 + Math.random() * 25),
      msg: isDown ? 'connect ECONNREFUSED 192.168.29.11:5173' : '200 OK'
    });
  }

  // Create 100% uptime ticks for "acad"
  const acadHeartbeats = [];
  for (let i = 35; i >= 0; i--) {
    acadHeartbeats.push({
      time: now - i * 50 * 1000,
      status: 'up',
      ping: Math.round(15 + Math.random() * 20),
      msg: '200 OK'
    });
  }

  // Disk monitor ticks
  const diskHeartbeats = [];
  for (let i = 35; i >= 0; i--) {
    diskHeartbeats.push({
      time: now - i * 50 * 1000,
      status: 'up',
      ping: 95, // 95% used
      msg: 'Disk C: at 95% capacity (Warning threshold 90%)'
    });
  }

  return [
    {
      id: '1',
      name: 'Ops',
      tag: 'Ops #1',
      type: 'http',
      url: 'http://192.168.29.11:5173/',
      interval: 50,
      active: true,
      heartbeats: opsHeartbeats,
      status: 'down',
      lastPing: 0,
      avgPing: 12.09,
      uptime24h: 70.45,
      uptime30d: 70.45,
      uptime1y: 70.45,
      lastError: '[Ops] [DOWN] connect ECONNREFUSED 192.168.29.11:5173'
    },
    {
      id: '2',
      name: 'acad',
      tag: 'acad',
      type: 'http',
      url: 'https://google.com',
      interval: 50,
      active: true,
      heartbeats: acadHeartbeats,
      status: 'up',
      lastPing: 18,
      avgPing: 22.4,
      uptime24h: 100,
      uptime30d: 100,
      uptime1y: 100,
      lastError: null
    },
    {
      id: '3',
      name: 'System - Disk (C:)',
      tag: 'Hardware',
      type: 'disk',
      target: 'C:',
      threshold: 98, // Alert if > 98%
      interval: 30,
      active: true,
      heartbeats: diskHeartbeats,
      status: 'up',
      lastPing: 95,
      avgPing: 95,
      uptime24h: 100,
      uptime30d: 100,
      uptime1y: 100,
      lastError: null
    },
    {
      id: '4',
      name: 'System - Memory (RAM)',
      tag: 'Hardware',
      type: 'memory',
      threshold: 90, // Alert if > 90%
      interval: 30,
      active: true,
      heartbeats: acadHeartbeats.map(h => ({ ...h, ping: 49, msg: 'RAM at 49%' })),
      status: 'up',
      lastPing: 49,
      avgPing: 49,
      uptime24h: 100,
      uptime30d: 100,
      uptime1y: 100,
      lastError: null
    }
  ];
}

export function loadMonitors() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const defaults = getDefaultMonitors();
      saveMonitors(defaults);
      return defaults;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load monitors:', err);
    return getDefaultMonitors();
  }
}

export function saveMonitors(monitors) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(monitors, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save monitors:', err);
  }
}
