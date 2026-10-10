import React from 'react';
import { Gauge, FileText, Moon, HardDrive, Send, Activity, User, LogOut } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, hostInfo, onOpenTelegramModal, currentUser, onLogout }) {
  return (
    <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border px-4 flex items-center justify-between select-none z-30 sticky top-0 shadow-xs">
      {/* Brand */}
      <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs group-hover:scale-105 transition-transform">
          <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-foreground font-sans">
            Uptime Kuma
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
            Darkmatter
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {hostInfo && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border">
            <HardDrive className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[11px]">
              Host: <strong className="text-foreground font-mono">{hostInfo.hostname}</strong>
            </span>
          </div>
        )}

        <button
          onClick={onOpenTelegramModal}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-secondary bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 transition-all shadow-xs"
        >
          <Send className="w-3.5 h-3.5 -rotate-45" />
          <span>Telegram</span>
        </button>

        <button
          onClick={() => setCurrentView('telemetry')}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-all shadow-xs ${
            currentView === 'telemetry'
              ? 'bg-accent text-accent-foreground border-border shadow-xs'
              : 'text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-primary" />
          <span>Host Telemetry</span>
        </button>

        <button
          onClick={() => setCurrentView('status')}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border transition-all shadow-xs ${
            currentView === 'status'
              ? 'bg-accent text-accent-foreground border-border shadow-xs'
              : 'text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Status</span>
        </button>

        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all shadow-sm ${
            currentView === 'dashboard'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs text-foreground">
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold font-mono">{currentUser.username}</span>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-border hover:border-rose-500/30 transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
