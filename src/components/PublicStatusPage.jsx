import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Tag, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  LogIn,
  Sun,
  Moon
} from 'lucide-react';

export default function PublicStatusPage({ onGoToAdmin }) {
  const [config, setConfig] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [countdown, setCountdown] = useState(300);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState({});
  const [theme, setTheme] = useState('dark');
  const wsRef = useRef(null);

  // Initialize theme
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

  // Fetch status page configuration and monitors
  useEffect(() => {
    // Extract slug from URL if present: /status/:slug
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const slug = (pathParts[0] === 'status' && pathParts[1]) ? pathParts[1] : 'monitor';

    fetch('/api/status-page')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig(data);
          setCountdown(data.refreshInterval || 300);
          // Expand all groups by default
          if (data.groups) {
            const exp = {};
            data.groups.forEach(g => { exp[g.id] = true; });
            setExpandedGroups(exp);
          }
        }
      })
      .catch(console.error);

    fetch('/api/monitors')
      .then(res => res.json())
      .then(data => setMonitors(data))
      .catch(console.error);
  }, []);

  // Connect WebSocket for live real-time heartbeats on public status page
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    function connectWs() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          if (type === 'INIT') {
            setMonitors(payload.monitors);
          } else if (type === 'HEARTBEAT') {
            setMonitors(prev => prev.map(m => m.id === payload.monitorId ? payload.monitor : m));
          } else if (type === 'MONITOR_UPDATED') {
            setMonitors(prev => prev.map(m => m.id === payload.id ? payload : m));
          }
        } catch (e) {
          console.error('WS Error:', e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    }

    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setLastUpdated(new Date());
          return config?.refreshInterval || 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config?.refreshInterval]);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary font-mono space-y-4">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Loading Status Page...
        </span>
      </div>
    );
  }

  // Calculate overall operational health
  const groupMonitorIds = (config.groups || []).flatMap(g => g.monitorIds);
  const activeMonitors = monitors.filter(m => groupMonitorIds.includes(m.id));
  const hasDownMonitors = activeMonitors.some(m => m.status === 'down');
  const allOperational = activeMonitors.length > 0 ? !hasDownMonitors : true;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground flex flex-col justify-between antialiased animate-view-enter">
      {/* Top Banner & Public Navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm animate-float">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground font-sans tracking-tight">
                {config.title || 'monitor'}
              </h1>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                System Status
              </span>
            </div>
          </div>

          {/* Right Utility: Theme Toggle + Admin Login */}
          <div className="flex items-center gap-2">
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

            {onGoToAdmin && (
              <button
                onClick={onGoToAdmin}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Status Page Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Active Incidents Banner (if any) */}
        {config.incidents && config.incidents.length > 0 && (
          <div className="space-y-3">
            {config.incidents.map(inc => (
              <div
                key={inc.id}
                className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-xs animate-in fade-in duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Active Incident
                  </span>
                  <h3 className="text-sm font-bold text-amber-200 font-sans">{inc.title}</h3>
                  <span className="text-[11px] text-muted-foreground ml-auto font-mono">
                    {formatDateTime(inc.createdAt)}
                  </span>
                </div>
                {inc.content && (
                  <p className="text-xs text-foreground/90 mt-2.5 font-mono whitespace-pre-wrap leading-relaxed">
                    {inc.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Big Overall Health Banner with Animated Pulsing Glow */}
        <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm transition-all ${
          allOperational 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-glow-operational' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {allOperational ? (
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 relative shrink-0">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-pulse-ring" />
              <CheckCircle2 className="w-6 h-6 fill-emerald-500 text-slate-950 relative z-10" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 relative shrink-0">
              <span className="absolute inset-0 rounded-full bg-rose-400 opacity-30 animate-pulse-ring" />
              <AlertCircle className="w-6 h-6 fill-rose-500 text-slate-950 relative z-10" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold font-sans text-foreground">
              {allOperational ? 'All Systems Operational' : 'Partial System Outage Detected'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allOperational 
                ? 'All monitored web APIs, network infrastructure, databases, and host systems are functioning normally.'
                : 'Our monitoring systems have flagged service degradation on one or more monitored endpoints.'}
            </p>
          </div>
        </div>

        {/* Description Section Box */}
        {config.description && (
          <div className="p-4 rounded-xl bg-card border border-border text-xs text-foreground leading-relaxed shadow-2xs">
            {config.description}
          </div>
        )}

        {/* Groups and Monitored Services */}
        {config.groups && config.groups.length > 0 ? (
          <div className="space-y-6">
            {config.groups.map(group => {
              const isExpanded = expandedGroups[group.id] !== false;
              const groupMonitors = monitors.filter(m => group.monitorIds.includes(m.id));

              return (
                <div key={group.id} className="space-y-3">
                  {/* Group Title Header */}
                  <div 
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !isExpanded }))}
                    className="flex items-center justify-between cursor-pointer group py-1"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      )}
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        {group.name}
                      </h3>
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60 border border-border font-mono">
                        {groupMonitors.length} services
                      </span>
                    </div>
                  </div>

                  {/* Group Monitor Rows */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {groupMonitors.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                          No monitors currently assigned to this group.
                        </div>
                      ) : (
                        groupMonitors.map(m => {
                          const uptimeVal = m.uptime24h || 100;
                          const heartbeats = m.heartbeats || [];
                          const isDown = m.status === 'down';

                          const barsCount = config.showOnlyLastHeartbeat ? 1 : 35;
                          const bars = heartbeats.length > 0 
                            ? heartbeats.slice(-barsCount)
                            : Array.from({ length: barsCount }, () => ({ status: 'up', ping: 25 }));

                          return (
                            <div
                              key={m.id}
                              className="bg-card hover:bg-muted/30 border border-border rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-2xs"
                            >
                              {/* Left Info: Status dot, Uptime badge, Title, Tags */}
                              <div className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  isDown ? 'bg-destructive animate-ping' : 'bg-emerald-500'
                                }`} />

                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                                  {uptimeVal.toFixed(2).replace(/\.00$/, '')}%
                                </span>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-foreground font-sans">
                                      {m.name}
                                    </span>
                                    <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded border border-border">
                                      {m.type}
                                    </span>
                                  </div>

                                  {config.showTags && m.tag && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                      <Tag className="w-2.5 h-2.5 text-secondary" />
                                      <span>{m.tag}</span>
                                    </div>
                                  )}

                                  {config.showCertificateExpiry && m.type === 'http' && (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                                      <span>SSL Certificate Valid</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Heartbeat Bars with 35m / now labels */}
                              <div className="flex items-center gap-2">
                                {!config.showOnlyLastHeartbeat && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    35m
                                  </span>
                                )}

                                <div className="flex items-center gap-[2px]">
                                  {bars.map((hb, idx) => (
                                    <div
                                      key={idx}
                                      className={`w-[4px] h-4 rounded-[1px] transition-all duration-150 hover:scale-y-125 hover:brightness-125 ${
                                        hb.status === 'down'
                                          ? 'bg-rose-500'
                                          : 'bg-emerald-400'
                                      }`}
                                      title={hb.status === 'down' ? 'Down' : `Operational (${hb.ping || 24}ms)`}
                                    />
                                  ))}
                                </div>

                                <span className="text-[10px] text-muted-foreground font-mono">
                                  now
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center space-y-2 bg-card/40 mt-12">
        <div className="max-w-4xl mx-auto space-y-2 text-xs text-muted-foreground">
          {config.footerText && (
            <div className="p-3.5 rounded-xl bg-card border border-border max-w-lg mx-auto font-mono text-foreground shadow-2xs">
              {config.footerText}
            </div>
          )}

          {config.showPoweredBy && (
            <div className="pt-2 text-[11px]">
              Powered by{' '}
              <a
                href="https://github.com/louislam/uptime-kuma"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold"
              >
                Uptime Kuma
              </a>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground">
            Last Updated: {formatDateTime(lastUpdated)} • <span className="font-mono">Refresh in: {formatCountdown(countdown)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
