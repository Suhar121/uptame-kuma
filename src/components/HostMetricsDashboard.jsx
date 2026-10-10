import React, { useState, useEffect } from 'react';
import {
  Activity,
  HardDrive,
  Cpu,
  Zap,
  Wifi,
  Thermometer,
  Layers,
  Search,
  Sliders,
  BatteryMedium
} from 'lucide-react';

function TelemetryCard({
  title,
  subtitle,
  data = [],
  unit = '',
  color = 'oklch(0.7214 0.1337 49.9802)',
  multiLines = null,
  yMaxOverride = null
}) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-56 select-none shadow-xs text-card-foreground">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-sans">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          Gathering telemetry points...
        </div>
      </div>
    );
  }

  const width = 450;
  const height = 130;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 22;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  let allVals = [];
  if (multiLines) {
    multiLines.forEach(l => {
      allVals = allVals.concat(data.map(d => l.getValue(d) || 0));
    });
  } else {
    allVals = data.map(d => (typeof d === 'number' ? d : d.value || 0));
  }

  const rawMax = Math.max(...allVals, 1);
  const maxVal = yMaxOverride || (rawMax > 10 ? Math.ceil(rawMax * 1.15) : Math.ceil(rawMax * 10) / 10 || 1);
  const minVal = 0;

  const getX = (idx) => padLeft + (idx / (data.length - 1)) * chartW;
  const getY = (val) => padTop + chartH - ((Math.min(val, maxVal) - minVal) / (maxVal - minVal || 1)) * chartH;

  const yTicks = [0, Math.round(maxVal * 0.5 * 10) / 10, maxVal];
  const xLabels = [
    { idx: 0, time: data[0]?.time },
    { idx: Math.floor(data.length * 0.5), time: data[Math.floor(data.length * 0.5)]?.time },
    { idx: data.length - 1, time: data[data.length - 1]?.time }
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-56 select-none shadow-xs text-card-foreground hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground font-sans">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          <Sliders className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="mt-2 flex-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-${title.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((val, i) => {
            const y = getY(val);
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="oklch(0.2520 0 0)" strokeDasharray="2 2" strokeWidth="0.8" />
                <text x={padLeft - 6} y={y + 3} fill="oklch(0.6268 0 0)" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">
                  {val}{unit}
                </text>
              </g>
            );
          })}

          {/* Single line with area */}
          {!multiLines && (
            <>
              {(() => {
                const pts = data.map((d, i) => ({
                  x: getX(i),
                  y: getY(typeof d === 'number' ? d : d.value || 0)
                }));
                const linePath = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
                const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padTop + chartH} L ${pts[0].x} ${padTop + chartH} Z`;
                return (
                  <>
                    <path d={areaPath} fill={`url(#grad-${title.replace(/[^a-zA-Z]/g, '')})`} />
                    <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                );
              })()}
            </>
          )}

          {/* Multi lines */}
          {multiLines && multiLines.map((line, lineIdx) => {
            const pts = data.map((d, i) => ({
              x: getX(i),
              y: getY(line.getValue(d) || 0)
            }));
            const linePath = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
            return (
              <path
                key={lineIdx}
                d={linePath}
                fill="none"
                stroke={line.color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* X axis timestamps */}
          {xLabels.map((lbl, i) => (
            <text
              key={i}
              x={getX(lbl.idx)}
              y={height - 2}
              fill="oklch(0.6268 0 0)"
              fontSize="9"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              {lbl.time ? new Date(lbl.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend if multilines */}
      {multiLines && (
        <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-muted-foreground font-mono">
          {multiLines.map((l, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-2.5 h-1 rounded-sm" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HostMetricsDashboard() {
  const [history, setHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState('');
  const [hostInfo, setHostInfo] = useState(null);

  const fetchTelemetry = () => {
    Promise.all([
      fetch('/api/system/metrics-history').then(r => r.json()),
      fetch('/api/system/services').then(r => r.json()),
      fetch('/api/system/overview').then(r => r.json())
    ])
      .then(([hist, srv, overview]) => {
        setHistory(hist);
        setServices(srv);
        setHostInfo(overview);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(serviceFilter.toLowerCase())
  );

  return (
    <div className="flex-1 bg-background text-foreground overflow-y-auto p-6 space-y-6 select-none font-mono">
      {/* Top Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2 font-sans">
            <Activity className="w-5 h-5 text-primary" />
            <span>Host Resource & Hardware Telemetry</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time operating system metrics across Linux & Windows kernels
          </p>
        </div>

        {hostInfo && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="px-3 py-1 rounded-lg bg-card border border-border shadow-2xs">
              OS: <strong className="text-foreground">{hostInfo.platform} ({hostInfo.distro || hostInfo.kernel})</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-card border border-border shadow-2xs">
              Host: <strong className="text-foreground">{hostInfo.hostname}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Grid of Telemetry Cards (Matches user screenshots 1 & 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. CPU Usage */}
        <TelemetryCard
          title="CPU Usage"
          subtitle="Average system-wide CPU utilization"
          data={history.map(h => ({ time: h.time, value: h.cpu.percent }))}
          unit="%"
          color="#3b82f6"
          yMaxOverride={100}
        />

        {/* 2. Memory Usage */}
        <TelemetryCard
          title="Memory Usage"
          subtitle="Precise utilization at the recorded time"
          data={history.map(h => ({ time: h.time, value: h.memory.usedGB }))}
          unit=" GB"
          color="#10b981"
          yMaxOverride={hostInfo?.memory?.total ? Math.round(hostInfo.memory.total / 1e9) : 16}
        />

        {/* 3. Disk (Root / C:) Usage */}
        <TelemetryCard
          title="Root / Disk Usage"
          subtitle="Disk storage utilization"
          data={history.map(h => ({ time: h.time, value: h.disk.usedGB }))}
          unit=" GB"
          color="#a855f7"
          yMaxOverride={history[0]?.disk?.totalGB || 250}
        />

        {/* 4. Root / Disk I/O Throughput */}
        <TelemetryCard
          title="Root I/O"
          subtitle="Throughput of root storage"
          data={history}
          unit=" KB/s"
          color="#f97316"
          multiLines={[
            { label: 'Total I/O', color: '#f97316', getValue: d => d.diskIO?.totalKBs || 0 },
            { label: 'Write I/O', color: '#06b6d4', getValue: d => d.diskIO?.writeKBs || 0 }
          ]}
        />

        {/* 5. Bandwidth */}
        <TelemetryCard
          title="Bandwidth"
          subtitle="Network traffic of public interfaces"
          data={history}
          unit=" KB/s"
          color="#ec4899"
          multiLines={[
            { label: 'Download (RX)', color: '#ec4899', getValue: d => d.network?.rxKBs || 0 },
            { label: 'Upload (TX)', color: '#06b6d4', getValue: d => d.network?.txKBs || 0 }
          ]}
        />

        {/* 6. Load Average */}
        <TelemetryCard
          title="Load Average"
          subtitle="System load averages over time"
          data={history}
          unit=""
          multiLines={[
            { label: '1 min', color: '#a855f7', getValue: d => d.loadAvg?.['1m'] || 0 },
            { label: '5 min', color: '#3b82f6', getValue: d => d.loadAvg?.['5m'] || 0 },
            { label: '15 min', color: '#f97316', getValue: d => d.loadAvg?.['15m'] || 0 }
          ]}
        />

        {/* 7. Temperature */}
        <TelemetryCard
          title="Temperature"
          subtitle="Temperatures of system sensors"
          data={history.map(h => ({ time: h.time, value: h.temperature?.main || 38 }))}
          unit=" °C"
          color="#eab308"
          yMaxOverride={100}
        />

        {/* 8. Battery */}
        <TelemetryCard
          title="Battery"
          subtitle={`Current state: ${history[history.length - 1]?.battery?.state || 'AC Connected'}`}
          data={history.map(h => ({ time: h.time, value: h.battery?.percent || 100 }))}
          unit="%"
          color="#3b82f6"
          yMaxOverride={100}
        />
      </div>

      {/* 9. Full Width: Wi-Fi Signal */}
      <div className="bg-card border border-border rounded-xl p-5 select-none shadow-xs text-card-foreground">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-sans">
              <Wifi className="w-4 h-4 text-rose-500" />
              <span>Wi-Fi signal</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Signal strength of connected Wi-Fi interfaces ({history[history.length - 1]?.wifi?.ssid || 'Default'})
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            {history[history.length - 1]?.wifi?.signalLevel || -65} dBm
          </span>
        </div>

        <div className="h-32">
          {history.length > 2 && (
            <svg viewBox="0 0 900 110" className="w-full h-full overflow-visible">
              {(() => {
                const vals = history.map(h => h.wifi?.signalLevel || -65);
                const min = -85;
                const max = -50;
                const getX = i => 40 + (i / (history.length - 1)) * 840;
                const getY = v => 10 + 80 - ((v - min) / (max - min)) * 80;

                const pts = vals.map((v, i) => ({ x: getX(i), y: getY(v) }));
                const path = pts.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
                return (
                  <>
                    {[-80, -70, -60].map((db, i) => (
                      <g key={i}>
                        <line x1={40} y1={getY(db)} x2={880} y2={getY(db)} stroke="oklch(0.2520 0 0)" strokeDasharray="2 2" />
                        <text x={35} y={getY(db) + 3} fill="oklch(0.6268 0 0)" fontSize="9" textAnchor="end">{db} dBm</text>
                      </g>
                    ))}
                    <path d={path} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                  </>
                );
              })()}
            </svg>
          )}
        </div>
      </div>

      {/* 10. Services Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden select-none shadow-xs text-card-foreground">
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 font-sans">
              <Layers className="w-4 h-4 text-primary" />
              <span>{hostInfo?.platform === 'linux' ? 'Systemd Services' : 'System & Background Services'}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total: {services.length} | Failed: {services.filter(s => s.state === 'Failed' || s.subState === 'Dead').length} | Auto-updated
            </p>
          </div>

          {/* Search Filter */}
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Filter services..."
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full bg-input text-xs text-foreground placeholder-muted-foreground pl-8 pr-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            />
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-muted/40 text-muted-foreground text-[11px] uppercase tracking-wider sticky top-0 border-b border-border">
              <tr>
                <th className="py-2.5 px-4 font-medium">Name</th>
                <th className="py-2.5 px-4 font-medium">State</th>
                <th className="py-2.5 px-4 font-medium">Sub State</th>
                <th className="py-2.5 px-4 font-medium">CPU (10m)</th>
                <th className="py-2.5 px-4 font-medium">CPU Peak</th>
                <th className="py-2.5 px-4 font-medium">Memory</th>
                <th className="py-2.5 px-4 font-medium">Memory Peak</th>
                <th className="py-2.5 px-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredServices.slice(0, 30).map((srv, idx) => (
                <tr key={idx} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-foreground font-mono text-[11px]">{srv.name}</td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      srv.state === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${srv.state === 'Active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      {srv.state}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      srv.subState === 'Running' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {srv.subState}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px]">{srv.cpu}</td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px]">{srv.cpuPeak}</td>
                  <td className="py-2.5 px-4 text-foreground font-mono text-[11px]">{srv.memory}</td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px]">{srv.memoryPeak}</td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-[10px]">{srv.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
