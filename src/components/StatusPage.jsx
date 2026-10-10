import React from 'react';
import { CheckCircle2, AlertOctagon, ArrowLeft } from 'lucide-react';
import HeartbeatStrip from './HeartbeatStrip';

export default function StatusPage({ monitors = [], onBackToDashboard }) {
  const allUp = monitors.every(m => m.status === 'up');
  const downCount = monitors.filter(m => m.status === 'down').length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background text-foreground p-6 md:p-12 max-w-4xl mx-auto space-y-8 select-none font-mono">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-card border border-border shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs text-muted-foreground font-mono">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Hero Operational Banner */}
      <div
        className={`p-6 rounded-xl border flex items-center gap-4 shadow-sm ${
          allUp
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}
      >
        {allUp ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
        ) : (
          <AlertOctagon className="w-8 h-8 text-destructive flex-shrink-0" />
        )}
        <div>
          <h2 className="text-xl font-bold text-foreground font-sans">
            {allUp ? 'All Systems Operational' : `Partial Outage (${downCount} service degraded)`}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {allUp
              ? 'All web applications, APIs, databases, and host disks are operating normally.'
              : 'Our monitoring system has detected issues on degraded services below.'}
          </p>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border shadow-xs">
        <div className="p-4 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
          Monitored Endpoints & Hardware Components
        </div>

        {monitors.map(m => {
          const isDown = m.status === 'down';
          return (
            <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDown ? 'bg-destructive animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold text-foreground font-sans">{m.name}</h3>
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {m.type === 'disk' ? `Disk Partition (${m.target})` : m.type} • {m.uptime24h}% Uptime
                  </span>
                </div>
              </div>

              {/* Heartbeat ticks & badge */}
              <div className="flex items-center gap-4">
                <HeartbeatStrip heartbeats={m.heartbeats || []} size="small" />
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                    isDown ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isDown ? 'Degraded' : 'Operational'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pt-6">
        Powered by <strong>Uptame Kuma</strong> • Darkmatter Theme
      </footer>
    </div>
  );
}
