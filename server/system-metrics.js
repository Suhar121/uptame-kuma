import si from 'systeminformation';

export async function getSystemDrives() {
  try {
    const fs = await si.fsSize();
    return fs.map(d => ({
      fs: d.fs,
      type: d.type,
      size: d.size,
      used: d.used,
      available: d.available,
      usePercent: Math.round(d.use * 10) / 10,
      mount: d.mount
    }));
  } catch (err) {
    console.error('Error fetching drives:', err);
    return [];
  }
}

export async function getSystemCpu() {
  try {
    const load = await si.currentLoad();
    return Math.round(load.currentLoad * 10) / 10;
  } catch (err) {
    console.error('Error fetching CPU:', err);
    return 0;
  }
}

export async function getSystemMemory() {
  try {
    const mem = await si.mem();
    const usedPercent = Math.round(((mem.total - mem.available) / mem.total) * 1000) / 10;
    return {
      total: mem.total,
      used: mem.total - mem.available,
      free: mem.available,
      usedPercent
    };
  } catch (err) {
    console.error('Error fetching Memory:', err);
    return { total: 0, used: 0, free: 0, usedPercent: 0 };
  }
}

export async function getHostOverview() {
  try {
    const [drives, cpu, mem, os] = await Promise.all([
      getSystemDrives(),
      getSystemCpu(),
      getSystemMemory(),
      si.osInfo()
    ]);
    return {
      hostname: os.hostname,
      platform: os.platform,
      distro: os.distro,
      drives,
      cpu,
      memory: mem
    };
  } catch (err) {
    return { error: err.message };
  }
}
