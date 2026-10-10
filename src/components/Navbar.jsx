import React from 'react';
import { Gauge, FileText, Sun, Moon, ShieldCheck, HardDrive, Send, Activity } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, hostInfo, onOpenTelegramModal }) {
  return (
    <header className="h-14 bg-[#0a101d] border-b border-[#1b253b] px-4 flex items-center justify-between select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
        <div className="w-8 h-8 rounded-full bg-[#1e2d48] border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <svg className="w-5 h-5 fill-emerald-400" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-lg tracking-tight text-white">Uptime Kuma</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            + Host
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {hostInfo && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-[#131b2e] px-2.5 py-1 rounded-md border border-[#1e2a44]">
            <HardDrive className="w-3.5 h-3.5 text-slate-300" />
            <span>Host: <strong className="text-slate-200">{hostInfo.hostname}</strong></span>
          </div>
        )}

        <button
          onClick={onOpenTelegramModal}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Telegram Alerts</span>
        </button>

        <button
          onClick={() => setCurrentView('telemetry')}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all ${
            currentView === 'telemetry'
              ? 'text-white bg-[#1e2b45]'
              : 'text-slate-300 hover:text-white hover:bg-[#151f33]'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Host Telemetry</span>
        </button>

        <button
          onClick={() => setCurrentView('status')}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all ${
            currentView === 'status'
              ? 'text-white bg-[#1e2b45]'
              : 'text-slate-300 hover:text-white hover:bg-[#151f33]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Status Pages</span>
        </button>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
            currentView === 'dashboard'
              ? 'bg-[#22c55e] text-slate-950 font-semibold shadow-sm shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white hover:bg-[#151f33]'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <div className="w-7 h-7 rounded-full bg-[#131c30] border border-[#1e2b45] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors">
          <Moon className="w-3.5 h-3.5" />
        </div>
      </div>
    </header>
  );
}
