import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_PAGE_FILE = path.join(__dirname, '..', 'data', 'status-page.json');

function getDefaultStatusPage() {
  return {
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
    groups: [
      {
        id: 'g1',
        name: 'Services',
        monitorIds: ['2', '1'] // acad and Ops
      }
    ],
    incidents: []
  };
}

export function loadStatusPage() {
  try {
    if (fs.existsSync(STATUS_PAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_PAGE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load status page:', err);
  }
  const def = getDefaultStatusPage();
  saveStatusPage(def);
  return def;
}

export function saveStatusPage(config) {
  try {
    fs.writeFileSync(STATUS_PAGE_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save status page:', err);
  }
}
