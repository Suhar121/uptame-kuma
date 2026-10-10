import { 
  getStatusPageDb, 
  getAllStatusPagesDb, 
  saveStatusPageDb, 
  deleteStatusPageDb, 
  addIncidentDb, 
  deleteIncidentDb 
} from './db.js';

export function getAllStatusPages() {
  return getAllStatusPagesDb();
}

export function loadStatusPage(slug = 'monitor') {
  return getStatusPageDb(slug);
}

export function saveStatusPage(config) {
  saveStatusPageDb(config);
}

export function deleteStatusPage(slug) {
  deleteStatusPageDb(slug);
}

export { addIncidentDb, deleteIncidentDb };
