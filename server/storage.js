import { 
  getMonitorsFromDb, 
  saveMonitorToDb, 
  deleteMonitorFromDb, 
  addHeartbeatToDb, 
  clearMonitorHeartbeatsFromDb 
} from './db.js';

export function loadMonitors() {
  return getMonitorsFromDb();
}

export function saveMonitors(monitors) {
  if (Array.isArray(monitors)) {
    for (const m of monitors) {
      saveMonitorToDb(m);
    }
  }
}

export { 
  getMonitorsFromDb, 
  saveMonitorToDb, 
  deleteMonitorFromDb, 
  addHeartbeatToDb, 
  clearMonitorHeartbeatsFromDb 
};
