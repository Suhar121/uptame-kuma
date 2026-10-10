import React, { useState } from 'react';
import { Pause, Play, Edit2, Copy, Trash2, AlertTriangle, X, ChevronDown, Send, ShieldCheck, Clock } from 'lucide-react';
import HeartbeatStrip from './HeartbeatStrip';
import PingChart from './PingChart';

export default function MonitorDetail({
  monitor,
  onPause,
  onDelete,
  onClearData,
  onClone,
  onEdit,
  onToggleTelegram
}) {
  const [toastDismissed, setToastDismissed] = useState(false);

  if (!monitor) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background select-none">
        Select a monitor from the left sidebar
      </div>
    );
  }

  const isDown = monitor.status === 'down';
  const isDisk = monitor.type === 'disk';
  const isMemory = monitor.type === 'memory';
  const isCpu = monitor.type === 'cpu';
  const isHostMetric = isDisk || isMemory || isCpu;

  const currentVal = isDown
    ? 'N/A'
    : isHostMetric
    ? `${monitor.lastPing || 0}%`
    : `${monitor.lastPing || 0}ms`;

  const avgVal = isHostMetric
    ? `${monitor.avgPing || 0}%`
    : `${monitor.avgPing || 0}ms`;

  return (
    <div className="flex-1 bg-background text-foreground overflow-y-auto p-6 space-y-5 relative select-none">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 font-sans">
            <span>{monitor.tag || monitor.name}</span>
          </h1>

          {/* Subtitle / Target link */}
          {monitor.url ? (
            <a
              href={monitor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs font-mono px-2.5 py-0.5 rounded-md bg-secondary/10 text-secondary hover:underline border border-secondary/30 transition-colors"
            >
              {monitor.url}
            </a>
          ) : monitor.target ? (
            <span className="inline-block mt-1 text-xs font-mono px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/30">
              Host Partition: {monitor.target} (Alert threshold: {monitor.threshold}%)
            </span>
          ) : (
            <span className="inline-block mt-1 text-xs font-mono px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
              Native System Metric
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Per-Monitor Telegram Quick Toggle */}
          <button
            onClick={() => onToggleTelegram(monitor.id)}
            title="Toggle Telegram notifications for this monitor"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all shadow-xs ${
              monitor.telegramEnabled !== false
                ? 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25'
                : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <Send className="w-3.5 h-3.5 -rotate-45" />
            <span>Telegram: {monitor.telegramEnabled !== false ? 'Active' : 'Off'}</span>
          </button>

          <button
            onClick={() => onPause(monitor.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors shadow-xs"
          >
            {monitor.active ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{monitor.active ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => onEdit(monitor)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => onClone(monitor)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Clone</span>
          </button>

          <button
            onClick={() => onDelete(monitor.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Heartbeat Status Box */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            {/* Heartbeat bar */}
            <HeartbeatStrip heartbeats={monitor.heartbeats || []} size="large" />

            {/* Time Indicators */}
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono pt-1">
              <span>35m</span>
              <span>now</span>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span>Check every {monitor.interval || 50} seconds ({monitor.interval || 50} seconds)</span>
            </div>
          </div>

          {/* Large UP / DOWN Pill */}
          <div className="pl-6">
            <span
              className={`inline-block px-8 py-2 rounded-full font-bold text-base tracking-wide shadow-md font-sans ${
                isDown
                  ? 'bg-red-500 text-white shadow-red-500/20'
                  : 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isDown ? 'Down' : 'Up'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-border/80 transition-colors">
          <div className="text-[11px] text-muted-foreground font-medium">
            Response <span className="text-[10px] text-muted-foreground/70">(Current)</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{currentVal}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-border/80 transition-colors">
          <div className="text-[11px] text-muted-foreground font-medium">
            Avg. Response <span className="text-[10px] text-muted-foreground/70">(24h)</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{avgVal}</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-border/80 transition-colors">
          <div className="text-[11px] text-muted-foreground font-medium">
            Uptime <span className="text-[10px] text-muted-foreground/70">(24 hours)</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{monitor.uptime24h || 100}%</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-border/80 transition-colors">
          <div className="text-[11px] text-muted-foreground font-medium">
            Uptime <span className="text-[10px] text-muted-foreground/70">(30 days)</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{monitor.uptime30d || 100}%</div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs hover:border-border/80 transition-colors">
          <div className="text-[11px] text-muted-foreground font-medium">
            Uptime <span className="text-[10px] text-muted-foreground/70">(1 year)</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">{monitor.uptime1y || 100}%</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-2 rounded-xs bg-emerald-500 inline-block" />
            <span className="text-foreground font-medium">
              {isHostMetric ? 'Usage History' : 'Avg Ping'}
            </span>
          </div>

          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md bg-muted/60 border border-border text-[11px] transition-colors">
            <span>Recent</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>

        {/* SVG Chart */}
        <PingChart heartbeats={monitor.heartbeats || []} monitorType={monitor.type} />

        {/* Clear Data Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => onClearData(monitor.id)}
            className="flex items-center gap-1.5 text-[11px] text-destructive hover:brightness-110 px-3 py-1 rounded-md bg-destructive/10 border border-destructive/20 transition-colors shadow-xs"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Data</span>
          </button>
        </div>
      </div>

      {/* Bottom Right Alert Toast */}
      {isDown && monitor.lastError && !toastDismissed && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl animate-bounce-once max-w-lg border border-red-500/50">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold leading-relaxed font-mono">
            {monitor.lastError}
          </span>
          <button
            onClick={() => setToastDismissed(true)}
            className="ml-auto w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
