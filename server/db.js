import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'kuma.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new Database(DB_FILE);

// Enable WAL mode for high concurrent throughput
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS monitors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT,
    type TEXT NOT NULL,
    url TEXT,
    target TEXT,
    interval INTEGER DEFAULT 60,
    active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    uptime24h REAL DEFAULT 100,
    uptime30d REAL DEFAULT 100,
    uptime1y REAL DEFAULT 100,
    avg_ping REAL DEFAULT 0,
    last_ping REAL DEFAULT 0,
    last_error TEXT,
    threshold REAL,
    telegram_enabled INTEGER DEFAULT 1,
    telegram_bot_token TEXT,
    telegram_chat_id TEXT,
    config_json TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    monitor_id TEXT NOT NULL,
    status TEXT NOT NULL,
    ping REAL DEFAULT 0,
    msg TEXT,
    time INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_heartbeats_monitor_time ON heartbeats (monitor_id, time DESC);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS status_page (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    footer_text TEXT,
    refresh_interval INTEGER DEFAULT 300,
    theme TEXT DEFAULT 'auto',
    show_tags INTEGER DEFAULT 0,
    show_powered_by INTEGER DEFAULT 1,
    show_certificate_expiry INTEGER DEFAULT 0,
    show_only_last_heartbeat INTEGER DEFAULT 0,
    domain_names TEXT,
    groups_json TEXT
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    status_page_slug TEXT DEFAULT 'monitor',
    title TEXT NOT NULL,
    content TEXT,
    style TEXT DEFAULT 'warning',
    created_at TEXT NOT NULL
  );
`);

console.log(`[SQLite] Database initialized at ${DB_FILE} with WAL mode.`);

// Auto-migration from legacy JSON files (if database tables are newly created)
function migrateFromLegacyJson() {
  // 1. Migrate Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const legacyUsersFile = path.join(DATA_DIR, 'users.json');
  if (userCount === 0 && fs.existsSync(legacyUsersFile)) {
    try {
      const users = JSON.parse(fs.readFileSync(legacyUsersFile, 'utf8'));
      const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, username, hash, salt, created_at) VALUES (?, ?, ?, ?, ?)');
      for (const u of users) {
        insertUser.run(u.id, u.username, u.hash, u.salt, u.createdAt || Date.now());
      }
      console.log(`[SQLite] Migrated ${users.length} users from users.json`);
    } catch (e) {
      console.error('[SQLite] User migration error:', e);
    }
  }

  // 2. Migrate Monitors & Heartbeats
  const monitorCount = db.prepare('SELECT COUNT(*) as count FROM monitors').get().count;
  const legacyMonitorsFile = path.join(DATA_DIR, 'monitors.json');
  if (monitorCount === 0) {
    let monitorsToImport = [];
    if (fs.existsSync(legacyMonitorsFile)) {
      try {
        monitorsToImport = JSON.parse(fs.readFileSync(legacyMonitorsFile, 'utf8'));
      } catch (e) {
        console.error('[SQLite] Failed to read monitors.json:', e);
      }
    }

    if (monitorsToImport.length > 0) {
      const insertMonitor = db.prepare(`
        INSERT OR REPLACE INTO monitors (
          id, name, tag, type, url, target, interval, active, status,
          uptime24h, uptime30d, uptime1y, avg_ping, last_ping, last_error,
          threshold, telegram_enabled, telegram_bot_token, telegram_chat_id,
          config_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertHeartbeat = db.prepare(`
        INSERT INTO heartbeats (monitor_id, status, ping, msg, time)
        VALUES (?, ?, ?, ?, ?)
      `);

      const importTx = db.transaction((monitors) => {
        for (const m of monitors) {
          insertMonitor.run(
            m.id,
            m.name,
            m.tag || m.name,
            m.type,
            m.url || null,
            m.target || null,
            m.interval || 60,
            m.active ? 1 : 0,
            m.status || 'up',
            m.uptime24h || 100,
            m.uptime30d || 100,
            m.uptime1y || 100,
            m.avgPing || 0,
            m.lastPing || 0,
            m.lastError || null,
            m.threshold || null,
            m.telegramEnabled !== false ? 1 : 0,
            m.telegramBotToken || null,
            m.telegramChatId || null,
            JSON.stringify(m),
            m.createdAt || Date.now()
          );

          if (Array.isArray(m.heartbeats)) {
            for (const h of m.heartbeats) {
              insertHeartbeat.run(m.id, h.status, h.ping || 0, h.msg || '', h.time || Date.now());
            }
          }
        }
      });

      importTx(monitorsToImport);
      console.log(`[SQLite] Migrated ${monitorsToImport.length} monitors to SQLite database.`);
    }
  }

  // 3. Migrate Settings
  const settingCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
  const legacySettingsFile = path.join(DATA_DIR, 'settings.json');
  if (settingCount === 0 && fs.existsSync(legacySettingsFile)) {
    try {
      const settings = JSON.parse(fs.readFileSync(legacySettingsFile, 'utf8'));
      const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      for (const [k, v] of Object.entries(settings)) {
        insertSetting.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
      console.log('[SQLite] Migrated settings from settings.json to SQLite database.');
    } catch (e) {
      console.error('[SQLite] Settings migration error:', e);
    }
  }

  // 4. Migrate Status Page
  const statusPageCount = db.prepare('SELECT COUNT(*) as count FROM status_page').get().count;
  const legacyStatusFile = path.join(DATA_DIR, 'status-page.json');
  if (statusPageCount === 0 && fs.existsSync(legacyStatusFile)) {
    try {
      const sp = JSON.parse(fs.readFileSync(legacyStatusFile, 'utf8'));
      saveStatusPageDb(sp);
      console.log('[SQLite] Migrated status-page configuration to SQLite database.');
    } catch (e) {
      console.error('[SQLite] Status page migration error:', e);
    }
  }
}

// =========================================================================
// MONITORS DAO
// =========================================================================

export function getMonitorsFromDb() {
  const rows = db.prepare('SELECT * FROM monitors ORDER BY created_at ASC').all();
  return rows.map(r => {
    // Fetch last 36 heartbeats
    const heartbeats = db.prepare(
      'SELECT status, ping, msg, time FROM heartbeats WHERE monitor_id = ? ORDER BY time DESC LIMIT 36'
    ).all(r.id).reverse();

    let extraConfig = {};
    if (r.config_json) {
      try {
        extraConfig = JSON.parse(r.config_json);
      } catch (e) {}
    }

    return {
      ...extraConfig,
      id: r.id,
      name: r.name,
      tag: r.tag,
      type: r.type,
      url: r.url,
      target: r.target,
      interval: r.interval,
      active: Boolean(r.active),
      status: r.status,
      uptime24h: r.uptime24h,
      uptime30d: r.uptime30d,
      uptime1y: r.uptime1y,
      avgPing: r.avg_ping,
      lastPing: r.last_ping,
      lastError: r.last_error,
      threshold: r.threshold,
      telegramEnabled: Boolean(r.telegram_enabled),
      telegramBotToken: r.telegram_bot_token,
      telegramChatId: r.telegram_chat_id,
      heartbeats
    };
  });
}

export function saveMonitorToDb(m) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO monitors (
      id, name, tag, type, url, target, interval, active, status,
      uptime24h, uptime30d, uptime1y, avg_ping, last_ping, last_error,
      threshold, telegram_enabled, telegram_bot_token, telegram_chat_id,
      config_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    m.id,
    m.name,
    m.tag || m.name,
    m.type,
    m.url || null,
    m.target || null,
    m.interval || 60,
    m.active ? 1 : 0,
    m.status || 'up',
    m.uptime24h || 100,
    m.uptime30d || 100,
    m.uptime1y || 100,
    m.avgPing || 0,
    m.lastPing || 0,
    m.lastError || null,
    m.threshold || null,
    m.telegramEnabled !== false ? 1 : 0,
    m.telegramBotToken || null,
    m.telegramChatId || null,
    JSON.stringify(m),
    m.createdAt || Date.now()
  );
}

export function deleteMonitorFromDb(id) {
  db.prepare('DELETE FROM monitors WHERE id = ?').run(id);
  db.prepare('DELETE FROM heartbeats WHERE monitor_id = ?').run(id);
}

export function addHeartbeatToDb(monitorId, beat) {
  db.prepare(`
    INSERT INTO heartbeats (monitor_id, status, ping, msg, time)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    monitorId,
    beat.status,
    beat.ping || 0,
    beat.msg || '',
    beat.time || Date.now()
  );

  // Keep last 100 heartbeats per monitor to optimize storage
  db.prepare(`
    DELETE FROM heartbeats WHERE monitor_id = ? AND id NOT IN (
      SELECT id FROM heartbeats WHERE monitor_id = ? ORDER BY time DESC LIMIT 100
    )
  `).run(monitorId, monitorId);
}

export function clearMonitorHeartbeatsFromDb(monitorId) {
  db.prepare('DELETE FROM heartbeats WHERE monitor_id = ?').run(monitorId);
}

// =========================================================================
// USERS DAO
// =========================================================================

export function getUsersFromDb() {
  return db.prepare('SELECT id, username, hash, salt, created_at as createdAt FROM users').all();
}

export function insertUserToDb(u) {
  db.prepare(`
    INSERT INTO users (id, username, hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(u.id, u.username, u.hash, u.salt, u.createdAt || Date.now());
}

export function deleteUserFromDb(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// =========================================================================
// SETTINGS DAO
// =========================================================================

export function getSettingsFromDb() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) {
    try {
      obj[r.key] = JSON.parse(r.value);
    } catch {
      obj[r.key] = r.value;
    }
  }
  return obj;
}

export function saveSettingsToDb(settingsObj) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(settingsObj)) {
    stmt.run(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
}

// =========================================================================
// STATUS PAGE DAO
// =========================================================================

export function getStatusPageDb(slug = 'monitor') {
  const row = db.prepare('SELECT * FROM status_page WHERE slug = ?').get(slug);
  const incidents = db.prepare('SELECT * FROM incidents WHERE status_page_slug = ? ORDER BY created_at DESC').all(slug);

  if (!row) {
    const def = {
      slug: 'monitor',
      title: 'monitor',
      description: 'hahhaah',
      footerText: 'Developed By Suhar Yaseen',
      refreshInterval: 300,
      theme: 'auto',
      showTags: false,
      showPoweredBy: true,
      showCertificateExpiry: false,
      showOnlyLastHeartbeat: false,
      domainNames: [],
      groups: [
        {
          id: 'g1',
          name: 'Services',
          monitorIds: ['2', '1']
        }
      ],
      incidents: []
    };
    saveStatusPageDb(def);
    return def;
  }

  let groups = [];
  try {
    groups = JSON.parse(row.groups_json || '[]');
  } catch (e) {}

  let domainNames = [];
  try {
    domainNames = JSON.parse(row.domain_names || '[]');
  } catch (e) {}

  return {
    slug: row.slug,
    title: row.title,
    description: row.description || '',
    footerText: row.footer_text || '',
    refreshInterval: row.refresh_interval || 300,
    theme: row.theme || 'auto',
    showTags: Boolean(row.show_tags),
    showPoweredBy: Boolean(row.show_powered_by),
    showCertificateExpiry: Boolean(row.show_certificate_expiry),
    showOnlyLastHeartbeat: Boolean(row.show_only_last_heartbeat),
    domainNames,
    groups,
    incidents: incidents.map(i => ({
      id: i.id,
      title: i.title,
      content: i.content,
      style: i.style,
      createdAt: i.created_at
    }))
  };
}

export function saveStatusPageDb(config) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO status_page (
      slug, title, description, footer_text, refresh_interval, theme,
      show_tags, show_powered_by, show_certificate_expiry, show_only_last_heartbeat,
      domain_names, groups_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    config.slug || 'monitor',
    config.title || 'monitor',
    config.description || '',
    config.footerText || '',
    config.refreshInterval || 300,
    config.theme || 'auto',
    config.showTags ? 1 : 0,
    config.showPoweredBy !== false ? 1 : 0,
    config.showCertificateExpiry ? 1 : 0,
    config.showOnlyLastHeartbeat ? 1 : 0,
    JSON.stringify(config.domainNames || []),
    JSON.stringify(config.groups || [])
  );
}

export function addIncidentDb(slug = 'monitor', incident) {
  db.prepare(`
    INSERT OR REPLACE INTO incidents (id, status_page_slug, title, content, style, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    incident.id,
    slug,
    incident.title,
    incident.content || '',
    incident.style || 'warning',
    incident.createdAt || new Date().toISOString()
  );
}

export function deleteIncidentDb(id) {
  db.prepare('DELETE FROM incidents WHERE id = ?').run(id);
}

// Run auto migration
migrateFromLegacyJson();

export default db;
