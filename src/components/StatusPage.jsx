import React from 'react';
import { CheckCircle2, AlertOctagon, ArrowLeft } from 'lucide-react';
import HeartbeatStrip from './HeartbeatStrip';

export default function StatusPage({ monitors = [], onBackToDashboard }) {
  const allUp = monitors.every(m => m.status === 'up');
  const downCount = monitors.filter(m => m.status === 'down').length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#090e1a] text-slate-200 p-6 md:p-12 max-w-4xl mx-auto space-y-8 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
        <span className="text-xs text-slate-500 font-mono">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Hero Operational Banner */}
      <div
        className={`p-6 rounded-xl border flex items-center gap-4 ${
          allUp
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}
      >
        {allUp ? (
          <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
        ) : (
          <AlertOctagon className="w-8 h-8 text-red-400 flex-shrink-0" />
        )}
        <div>
          <h2 className="text-xl font-bold text-white">
            {allUp ? 'All Systems Operational' : `Partial Outage (${downCount} service degraded)`}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {allUp
              ? 'All web applications, APIs, databases, and host disks are operating normally.'
              : 'Our monitoring system has detected issues on degraded services below.'}
          </p>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-[#0f1728] border border-[#1b253b] rounded-xl overflow-hidden divide-y divide-[#172238]">
        <div className="p-4 bg-[#111a2d] text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Services & Hardware Components
        </div>

        {monitors.map(m => {
          const isDown = m.status === 'down';
          return (
            <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDown ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                  <span className="text-[11px] text-slate-400 capitalize">
                    {m.type === 'disk' ? `Disk Partition (${m.target})` : m.type} • {m.uptime24h}% Uptime
                  </span>
                </div>
              </div>

              {/* Heartbeat ticks & badge */}
              <div className="flex items-center gap-4">
                <HeartbeatStrip heartbeats={m.heartbeats || []} size="small" />
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isDown ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
      <footer className="text-center text-xs text-slate-500 pt-6">
        Powered by <strong>Uptime Kuma</strong> with Integrated Host Diagnostics
      </footer>
    </div>
  );
}
