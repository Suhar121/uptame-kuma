import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { monitorEngine } from './monitor-engine.js';
import { getSystemDrives, getHostOverview } from './system-metrics.js';

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

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Uptime Kuma backend with Native System/Disk monitoring listening on port ${PORT}`);
  monitorEngine.start();
});
