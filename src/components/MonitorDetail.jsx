import React, { useState } from 'react';
import { Pause, Play, Edit2, Copy, Trash2, ExternalLink, AlertTriangle, X, ChevronDown } from 'lucide-react';
import HeartbeatStrip from './HeartbeatStrip';
import PingChart from './PingChart';

export default function MonitorDetail({
  monitor,
  onPause,
  onDelete,
  onClearData,
  onClone
}) {
  const [toastDismissed, setToastDismissed] = useState(false);

  if (!monitor) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-[#0a101d]">
        Select a monitor from the left sidebar
      </div>
    );
  }

  const isDown = monitor.status === 'down';
  const isDisk = monitor.type === 'disk';
  const isMemory = monitor.type === 'memory';
  const isCpu = monitor.type === 'cpu';
  const isHostMetric = isDisk || isMemory || isCpu;

  // Formatting values
  const currentVal = isDown
    ? 'N/A'
    : isHostMetric
    ? `${monitor.lastPing || 0}%`
    : `${monitor.lastPing || 0}ms`;

  const avgVal = isHostMetric
    ? `${monitor.avgPing || 0}%`
    : `${monitor.avgPing || 0}ms`;

  return (
    <div className="flex-1 bg-[#090f1c] overflow-y-auto p-6 space-y-5 relative">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{monitor.tag || monitor.name}</span>
          </h1>

          {/* Subtitle / Target link */}
          {monitor.url ? (
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 hover:underline border border-blue-500/30"
            >
              {monitor.url}
            </a>
          ) : monitor.target ? (
            <span className="inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Host Partition: {monitor.target} (Alert threshold: {monitor.threshold}%)
            </span>
          ) : (
            <span className="inline-block mt-1 text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Native System Metric
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => onPause(monitor.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131d2f] hover:bg-[#1a273f] text-slate-200 border border-[#202e48] transition-colors"
          >
            {monitor.active ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{monitor.active ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131d2f] hover:bg-[#1a273f] text-slate-200 border border-[#202e48] transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onClone(monitor)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131d2f] hover:bg-[#1a273f] text-slate-200 border border-[#202e48] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Clone</span>
          </button>

          <button
            onClick={() => onDelete(monitor.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#131d2f] hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Heartbeat Status Box */}
      <div className="bg-[#0f1728] rounded-lg border border-[#1b263e] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            {/* Heartbeat bar */}
            <HeartbeatStrip heartbeats={monitor.heartbeats || []} size="large" />

            {/* Time Indicators */}
            <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1">
              <span>35m</span>
              <span>now</span>
            </div>

            <div className="text-[11px] text-slate-400 pt-0.5">
              Check every {monitor.interval || 50} seconds ({monitor.interval || 50} seconds)
            </div>
          </div>

          {/* Large UP / DOWN Pill */}
          <div className="pl-6">
            <span
              className={`inline-block px-8 py-2 rounded-full font-bold text-lg tracking-wide shadow-md ${
                isDown
                  ? 'bg-[#ef4444] text-white shadow-red-500/20'
                  : 'bg-[#22c55e] text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isDown ? 'Down' : 'Up'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#0f1728] p-3.5 rounded-lg border border-[#1b263e]">
          <div className="text-[11px] text-slate-400 font-medium">
            Response <span className="text-[10px] text-slate-500">(Current)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{currentVal}</div>
        </div>

        <div className="bg-[#0f1728] p-3.5 rounded-lg border border-[#1b263e]">
          <div className="text-[11px] text-slate-400 font-medium">
            Avg. Response <span className="text-[10px] text-slate-500">(24 hours)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{avgVal}</div>
        </div>

        <div className="bg-[#0f1728] p-3.5 rounded-lg border border-[#1b263e]">
          <div className="text-[11px] text-slate-400 font-medium">
            Uptime <span className="text-[10px] text-slate-500">(24 hours)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{monitor.uptime24h || 100}%</div>
        </div>

        <div className="bg-[#0f1728] p-3.5 rounded-lg border border-[#1b263e]">
          <div className="text-[11px] text-slate-400 font-medium">
            Uptime <span className="text-[10px] text-slate-500">(30 days)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{monitor.uptime30d || 100}%</div>
        </div>

        <div className="bg-[#0f1728] p-3.5 rounded-lg border border-[#1b263e]">
          <div className="text-[11px] text-slate-400 font-medium">
            Uptime <span className="text-[10px] text-slate-500">(1 year)</span>
          </div>
          <div className="text-xl font-bold text-white mt-1">{monitor.uptime1y || 100}%</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#0f1728] p-4 rounded-lg border border-[#1b263e] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2 rounded-xs bg-[#22c55e] inline-block" />
            <span className="text-slate-200 font-medium">
              {isHostMetric ? 'Usage History' : 'Avg Ping'}
            </span>
          </div>

          <button className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-[#131c2e] border border-[#1d283f] text-[11px]">
            <span>Recent</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* SVG Chart */}
        <PingChart heartbeats={monitor.heartbeats || []} monitorType={monitor.type} />

        {/* Clear Data Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => onClearData(monitor.id)}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 px-2.5 py-1 rounded bg-[#141d30] border border-red-500/20"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Data</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Bottom Right Alert Toast (Exact match to screenshot) */}
      {isDown && monitor.lastError && !toastDismissed && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[#ef4444] text-white px-4 py-3 rounded-lg shadow-2xl animate-bounce-once max-w-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">
            {monitor.lastError}
          </span>
          <button
            onClick={() => setToastDismissed(true)}
            className="ml-auto w-6 h-6 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
