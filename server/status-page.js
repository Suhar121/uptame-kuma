import { getStatusPageDb, saveStatusPageDb, addIncidentDb, deleteIncidentDb } from './db.js';

export function loadStatusPage(slug = 'monitor') {
  return getStatusPageDb(slug);
}

export function saveStatusPage(config) {
  saveStatusPageDb(config);
}

export { addIncidentDb, deleteIncidentDb };
