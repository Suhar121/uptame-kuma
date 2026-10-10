import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { monitorEngine } from './monitor-engine.js';
import { getSystemDrives, getHostOverview, getMetricsHistory, getSystemServices } from './system-metrics.js';
import { getSettings, saveSettings, sendTelegramNotification } from './notifications.js';
import { isSetupRequired, createInitialAdmin, loginUser, verifySession, logoutUser } from './auth.js';
import { 
  getAllStatusPages, 
  loadStatusPage, 
  saveStatusPage, 
  deleteStatusPage, 
  addIncidentDb, 
  deleteIncidentDb 
} from './status-page.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// Serve production frontend assets if available
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Track connected WebSocket clients
const clients = new Set();
wss.on('connection', (ws) => {
  clients.add(ws);
  // Send current state on connection
  ws.send(JSON.stringify({
    type: 'INIT',
    payload: {
      monitors: monitorEngine.getMonitors()
    }
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });
});

monitorEngine.setWsClients(clients);

// REST API Endpoints
app.get('/api/monitors', (req, res) => {
  res.json(monitorEngine.getMonitors());
});

app.post('/api/monitors', (req, res) => {
  const newMonitor = monitorEngine.addMonitor(req.body);
  res.status(201).json(newMonitor);
});

app.delete('/api/monitors/:id', (req, res) => {
  monitorEngine.deleteMonitor(req.params.id);
  res.json({ success: true });
});

app.put('/api/monitors/:id', (req, res) => {
  const updated = monitorEngine.updateMonitor(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Monitor not found' });
  res.json(updated);
});

app.post('/api/monitors/:id/toggle-telegram', (req, res) => {
  const updated = monitorEngine.toggleTelegram(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Monitor not found' });
  res.json(updated);
});

app.post('/api/monitors/:id/pause', (req, res) => {
  const updated = monitorEngine.togglePause(req.params.id);
  res.json(updated);
});

app.post('/api/monitors/:id/clear', (req, res) => {
  monitorEngine.clearData(req.params.id);
  res.json({ success: true });
});

app.get('/api/system/drives', async (req, res) => {
  const drives = await getSystemDrives();
  res.json(drives);
});

app.get('/api/system/overview', async (req, res) => {
  const overview = await getHostOverview();
  res.json(overview);
});

app.get('/api/system/metrics-history', (req, res) => {
  res.json(getMetricsHistory());
});

app.get('/api/system/services', async (req, res) => {
  const services = await getSystemServices();
  res.json(services);
});

// Telegram / Notification Settings
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  saveSettings(req.body);
  res.json({ success: true, settings: req.body });
});

app.post('/api/settings/telegram/test', async (req, res) => {
  const { botToken, chatId } = req.body;
  try {
    const result = await sendTelegramNotification({
      botToken,
      chatId,
      text: '🎉 <b>Uptame Kuma Test Notification</b>\n\nYour Telegram bot is successfully connected and ready to send downtime alerts!'
    });
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Authentication Endpoints
app.get('/api/auth/setup-required', (req, res) => {
  res.json({ setupRequired: isSetupRequired() });
});

app.post('/api/auth/setup', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = createInitialAdmin(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = loginUser(username, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = verifySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  logoutUser(token);
  res.json({ success: true });
});

// Status Page Endpoints
app.get('/api/status-pages', (req, res) => {
  res.json(getAllStatusPages());
});

const handleGetStatusPage = (req, res) => {
  const slug = req.params.slug || req.query.slug || 'monitor';
  const page = loadStatusPage(slug);
  if (!page) {
    return res.status(404).json({ error: 'Status page not found' });
  }

  // If status page is private, verify user is logged in
  if (page.isPublic === false) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = verifySession(token);
    if (!user) {
      return res.json({
        slug: page.slug,
        title: page.title,
        isPublic: false,
        isRestricted: true,
        message: 'This status page is private. Please sign in to view.'
      });
    }
  }

  res.json(page);
};

app.get('/api/status-page', handleGetStatusPage);
app.get('/api/status-page/:slug', handleGetStatusPage);

app.post('/api/status-page', (req, res) => {
  saveStatusPage(req.body);
  res.json({ success: true, config: req.body });
});

app.delete('/api/status-page/:slug', (req, res) => {
  deleteStatusPage(req.params.slug);
  res.json({ success: true });
});

app.post('/api/status-page/incident', (req, res) => {
  const slug = req.body.slug || 'monitor';
  const newIncident = {
    id: 'inc-' + Date.now(),
    title: req.body.title || 'Service Degradation',
    content: req.body.content || '',
    style: req.body.style || 'warning',
    createdAt: new Date().toISOString()
  };
  addIncidentDb(slug, newIncident);
  res.json({ success: true, incident: newIncident, config: loadStatusPage(slug) });
});

app.delete('/api/status-page/incident/:id', (req, res) => {
  deleteIncidentDb(req.params.id);
  const slug = req.query.slug || 'monitor';
  res.json({ success: true, config: loadStatusPage(slug) });
});

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Uptame Kuma backend with Native System/Disk monitoring listening on port ${PORT}`);
  monitorEngine.start();
});
