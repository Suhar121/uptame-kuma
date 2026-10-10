import React, { useState, useEffect, useRef } from 'react';
import { 
  Gauge, 
  FileText, 
  Moon, 
  Sun, 
  HardDrive, 
  Send, 
  Activity, 
  User, 
  LogOut, 
  ChevronDown, 
  Globe, 
  Menu, 
  X,
  Bell,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  hostInfo, 
  onOpenTelegramModal, 
  currentUser, 
  onLogout,
  monitors = []
}) {
  const [theme, setTheme] = useState('dark');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Initialize theme from DOM or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('uptime_theme');
    const isDark = savedTheme ? savedTheme === 'dark' : document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    }
  }, []);

  // Handle outside click to close user menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(nextTheme);
    localStorage.setItem('uptime_theme', nextTheme);
  };

  const downMonitorsCount = monitors.filter(m => m.status === 'down').length;
  const totalMonitorsCount = monitors.length;

  return (
    <header className="h-14 bg-card/90 backdrop-blur-md border-b border-border px-3 sm:px-5 flex items-center justify-between select-none z-40 sticky top-0 shadow-xs">
      {/* =========================================================================
          LEFT: BRAND & HOST TELEMETRY STATUS
          ========================================================================= */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs group-hover:scale-105 group-hover:bg-primary/20 transition-all">
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground font-sans">
              Uptime Kuma
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
              Darkmatter
            </span>
          </div>
        </div>

        {/* Live Host Telemetry Badge */}
        {hostInfo && (
          <button
            onClick={() => { setCurrentView('telemetry'); setMobileMenuOpen(false); }}
            title="Click to view Host Telemetry"
            className="hidden xl:flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 px-2.5 py-1 rounded-md border border-border transition-colors group cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <HardDrive className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-colors" />
            <span className="text-[11px]">
              Host: <strong className="text-foreground font-mono">{hostInfo.hostname}</strong>
            </span>
          </button>
        )}
      </div>

      {/* =========================================================================
          CENTER: PRIMARY NAVIGATION SEGMENTED TABS (Desktop)
          ========================================================================= */}
      <nav className="hidden md:flex items-center bg-muted/50 p-1 rounded-xl border border-border shadow-2xs">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'dashboard'
              ? 'bg-primary text-primary-foreground shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Dashboard</span>
          {totalMonitorsCount > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              currentView === 'dashboard'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : downMonitorsCount > 0 
                  ? 'bg-destructive/20 text-destructive' 
                  : 'bg-muted text-muted-foreground'
            }`}>
              {totalMonitorsCount}
            </span>
          )}
        </button>

        {/* Tab 2: Host Telemetry */}
        <button
          onClick={() => setCurrentView('telemetry')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'telemetry'
              ? 'bg-primary text-primary-foreground shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Host Telemetry</span>
          <span className={`w-1.5 h-1.5 rounded-full ${
            currentView === 'telemetry' ? 'bg-primary-foreground' : 'bg-secondary animate-pulse'
          }`} />
        </button>

        {/* Tab 3: Status Page */}
        <button
          onClick={() => setCurrentView('status')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentView === 'status'
              ? 'bg-primary text-primary-foreground shadow-xs font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Status Page</span>
        </button>
      </nav>

      {/* =========================================================================
          RIGHT: TELEGRAM, THEME SWITCHER & USER MENU
          ========================================================================= */}
      <div className="flex items-center gap-2">
        {/* Telegram Notifications Modal Button */}
        <button
          onClick={onOpenTelegramModal}
          title="Configure Telegram Downtime Alerts"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-secondary bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="w-3.5 h-3.5 -rotate-45" />
          <span className="hidden sm:inline font-sans font-semibold">Telegram</span>
        </button>

        {/* Working Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-2xs hover:scale-105 active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User Profile & Dropdown Menu */}
        {currentUser && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-muted/50 hover:bg-muted/80 border border-border transition-colors text-xs text-foreground shadow-2xs"
            >
              <div className="w-6 h-6 rounded-md bg-primary/15 text-primary border border-primary/30 flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden sm:inline font-mono font-semibold max-w-[100px] truncate">
                {currentUser.username}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                userDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu Modal */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl p-1.5 z-50 font-mono animate-in fade-in-50 zoom-in-95">
                {/* User info banner */}
                <div className="px-3 py-2 border-b border-border/80 mb-1">
                  <div className="text-[11px] text-muted-foreground">Signed in as</div>
                  <div className="text-xs font-bold text-foreground font-sans truncate">
                    {currentUser.username}
                  </div>
                  <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider mt-0.5">
                    Administrator
                  </div>
                </div>

                {/* Quick Navigation Items */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                      currentView === 'dashboard'
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Monitors Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('telemetry');
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                      currentView === 'telemetry'
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Host Telemetry</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('status');
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                      currentView === 'status'
                        ? 'bg-primary/15 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Status Page Editor</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenTelegramModal();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors text-left"
                  >
                    <Send className="w-3.5 h-3.5 -rotate-45 text-secondary" />
                    <span>Telegram Alerts</span>
                  </button>
                </div>

                {/* Divider & Sign Out */}
                <div className="border-t border-border/80 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile menu button (visible on smaller screens) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-8 h-8 rounded-lg bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* =========================================================================
          MOBILE RESPONSIVE DRAWER (Visible when hamburger is opened)
          ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border p-4 shadow-2xl flex flex-col gap-2 z-50 font-mono animate-in slide-in-from-top-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1 border-b border-border">
            Navigation
          </div>

          <button
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            {totalMonitorsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {totalMonitorsCount} Monitors
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentView('telemetry');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'telemetry'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Activity className="w-4 h-4 text-primary" />
            <span>Host Resource Telemetry</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('status');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'status'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Status Page Editor</span>
          </button>

          <button
            onClick={() => {
              onOpenTelegramModal();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-secondary bg-secondary/10 border border-secondary/20"
          >
            <Send className="w-4 h-4 -rotate-45" />
            <span>Telegram Notifications</span>
          </button>

          {hostInfo && (
            <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between px-2">
              <span>Host Machine:</span>
              <span className="font-bold text-foreground">{hostInfo.hostname}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
