import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  Plus, 
  X, 
  ChevronDown, 
  ChevronUp, 
  GripVertical, 
  Settings, 
  Megaphone, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Trash2,
  Globe,
  Eye,
  Edit3,
  Copy,
  Check,
  Shield,
  Clock,
  Tag,
  Lock
} from 'lucide-react';
import IncidentModal from './IncidentModal';

export default function StatusPageEditor({ monitors = [], onBackToDashboard }) {
  const [config, setConfig] = useState({
    slug: 'monitor',
    title: 'monitor',
    description: 'hahhaah',
    footerText: 'Developed By Suhar Yaseen',
    refreshInterval: 300,
    theme: 'auto',
    showTags: false,
    showPoweredBy: true,
    showCertificateExpiry: false,
    showOnlyLastHeartbeat: false,
    domainNames: [],
    groups: [
      {
        id: 'g1',
        name: 'Services',
        monitorIds: ['2', '1']
      }
    ],
    incidents: []
  });

  const [initialConfig, setInitialConfig] = useState(null);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'saving' | null
  const [countdown, setCountdown] = useState(300);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState({ g1: true });
  const [selectedMonitorToAdd, setSelectedMonitorToAdd] = useState('');
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'visitor'
  const [copiedLink, setCopiedLink] = useState(false);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Fetch status page config from server
  useEffect(() => {
    fetch('/api/status-page')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setConfig(data);
          setInitialConfig(data);
          setCountdown(data.refreshInterval || 300);
        }
      })
      .catch(console.error);
  }, []);

  // Live countdown timer matching screenshot "Refresh in: 04:50"
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setLastUpdated(new Date());
          return config.refreshInterval || 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [config.refreshInterval]);

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

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/status-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setInitialConfig(config);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveStatus(null);
    }
  };

  const handleDiscard = () => {
    if (initialConfig) {
      setConfig({ ...initialConfig });
    }
  };

  const handleCreateIncident = async (incidentData) => {
    try {
      const res = await fetch('/api/status-page/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteIncident = async (id) => {
    try {
      const res = await fetch(`/api/status-page/incident/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddGroup = () => {
    const newGroup = {
      id: 'g-' + Date.now(),
      name: 'New Group',
      monitorIds: []
    };
    setConfig(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup]
    }));
    setExpandedGroups(prev => ({ ...prev, [newGroup.id]: true }));
  };

  const handleDeleteGroup = (groupId) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== groupId)
    }));
  };

  const handleUpdateGroupName = (groupId, name) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, name } : g)
    }));
  };

  const handleRemoveMonitorFromGroup = (groupId, monitorId) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            monitorIds: g.monitorIds.filter(id => id !== monitorId)
          };
        }
        return g;
      })
    }));
  };

  const handleAddMonitorToGroup = (groupId, monitorId) => {
    if (!monitorId) return;
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(g => {
        if (g.id === groupId && !g.monitorIds.includes(monitorId)) {
          return {
            ...g,
            monitorIds: [...g.monitorIds, monitorId]
          };
        }
        return g;
      })
    }));
    setSelectedMonitorToAdd('');
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/status/${config.slug || 'monitor'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Check overall health based on monitors in groups
  const groupMonitorIds = (config.groups || []).flatMap(g => g.monitorIds);
  const activeGroupMonitors = monitors.filter(m => groupMonitorIds.includes(m.id));
  const hasDownMonitors = activeGroupMonitors.some(m => m.status === 'down');
  const allOperational = activeGroupMonitors.length > 0 ? !hasDownMonitors : true;

  // Determine theme styling for preview container
  const previewThemeClass = config.theme === 'light' 
    ? 'light bg-white text-slate-900 border-slate-200' 
    : config.theme === 'dark' 
      ? 'dark bg-background text-foreground border-border' 
      : 'bg-background text-foreground border-border';

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background text-foreground min-h-[calc(100vh-3.5rem)] font-mono overflow-y-auto animate-view-enter">
      {/* =========================================================================
          LEFT COLUMN: STATUS PAGE SETTINGS & CONTROLS (Darkmatter Integrated)
          ========================================================================= */}
      {viewMode === 'editor' && (
        <div className="w-full lg:w-[320px] xl:w-[350px] bg-card/95 border-r border-border p-5 flex flex-col justify-between shrink-0 overflow-y-auto shadow-sm">
          <div className="space-y-4">
            {/* Header Title & Discard/Save indicator */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-primary" />
                <span>Page Configuration</span>
              </span>
              {saveStatus === 'saved' && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Saved!
                </span>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                Slug
              </label>
              <div className="flex rounded-lg bg-muted/40 border border-border overflow-hidden focus-within:ring-1 focus-within:ring-primary transition-all">
                <span className="px-2.5 py-1.5 text-xs text-muted-foreground bg-muted/60 border-r border-border select-none font-mono">
                  /status/
                </span>
                <input
                  type="text"
                  value={config.slug}
                  onChange={(e) => setConfig({ ...config, slug: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-transparent text-foreground placeholder-muted-foreground/50 focus:outline-none font-mono"
                  placeholder="monitor"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
                placeholder="monitor"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                Description
              </label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none transition-all"
                placeholder="hahhaah"
              />
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                Markdown syntax supported. If using HTML, avoid leading spaces to prevent formatting issues.
              </p>
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                Footer Text
              </label>
              <textarea
                rows={2}
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none transition-all"
                placeholder="Developed By Suhar Yaseen"
              />
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                Markdown syntax supported. If using HTML, avoid leading spaces to prevent formatting issues.
              </p>
            </div>

            {/* Refresh Interval */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                Refresh Interval
              </label>
              <input
                type="number"
                value={config.refreshInterval}
                onChange={(e) => setConfig({ ...config, refreshInterval: parseInt(e.target.value) || 300 })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
                placeholder="300"
              />
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                The status page will do a full site refresh every {config.refreshInterval} seconds
              </p>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 font-sans">
                Theme
              </label>
              <select
                value={config.theme}
                onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
              >
                <option value="auto">Auto (Matches System)</option>
                <option value="dark">Dark (Darkmatter Cosmic)</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Toggles / Switches */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              {/* Show Tags */}
              <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showTags}
                  onChange={(e) => setConfig({ ...config, showTags: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                <span className="text-xs">Show Tags</span>
              </label>

              {/* Show Powered By */}
              <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showPoweredBy}
                  onChange={(e) => setConfig({ ...config, showPoweredBy: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                <span className="text-xs">Show Powered By</span>
              </label>

              {/* Show Certificate Expiry */}
              <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showCertificateExpiry}
                  onChange={(e) => setConfig({ ...config, showCertificateExpiry: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                <span className="text-xs">Show Certificate Expiry</span>
              </label>

              {/* Show Only Last Heartbeat */}
              <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showOnlyLastHeartbeat}
                  onChange={(e) => setConfig({ ...config, showOnlyLastHeartbeat: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                <span className="text-xs">Show Only Last Heartbeat</span>
              </label>
            </div>

            {/* Domain Names */}
            <div className="pt-2">
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Domain Names</span>
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Save & Discard Buttons at Bottom */}
          <div className="pt-6 border-t border-border flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              onClick={handleDiscard}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          RIGHT COLUMN: LIVE STATUS PAGE (Darkmatter Preview + Visitor Mode)
          ========================================================================= */}
      <div className={`flex-1 p-5 md:p-8 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto transition-colors ${previewThemeClass}`}>
        {/* Top Control Bar: Visitor View Switcher, Link Copy & Dashboard Back */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Logo with remove/change icon */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm animate-float">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              {viewMode === 'editor' && (
                <button
                  title="Remove logo"
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground text-muted-foreground hover:text-foreground flex items-center justify-center text-[10px] transition-colors"
                >
                  ✖
                </button>
              )}
            </div>

            {/* Title display badge */}
            <div className="bg-muted/40 border border-border px-3.5 py-1.5 rounded-lg text-lg font-bold text-foreground font-sans shadow-2xs">
              {config.title || 'monitor'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Editor vs Visitor Preview */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border">
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'editor'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setViewMode('visitor')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'visitor'
                    ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview Visitor</span>
              </button>
            </div>

            {/* Copy public link */}
            <button
              onClick={handleCopyLink}
              title="Copy Public Status Page URL"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg bg-card border border-border shadow-2xs transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg bg-card border border-border shadow-2xs hover:bg-muted"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Create Incident Button (Editor mode) */}
        {viewMode === 'editor' && (
          <div>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Create Incident</span>
            </button>
          </div>
        )}

        {/* Active Incidents (if any) */}
        {config.incidents && config.incidents.length > 0 && (
          <div className="space-y-3">
            {config.incidents.map(inc => (
              <div
                key={inc.id}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-300"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Incident
                    </span>
                    <h4 className="text-sm font-bold text-amber-200 font-sans">{inc.title}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(inc.createdAt)}
                    </span>
                  </div>
                  {inc.content && (
                    <p className="text-xs text-foreground/90 mt-2 font-mono whitespace-pre-wrap">
                      {inc.content}
                    </p>
                  )}
                </div>
                {viewMode === 'editor' && (
                  <button
                    onClick={() => handleDeleteIncident(inc.id)}
                    className="text-muted-foreground hover:text-rose-400 p-1 transition-colors"
                    title="Resolve & Remove Incident"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Big Status Banner: "All Systems Operational" with Animated Glow */}
        <div className={`p-4 rounded-xl border flex items-center gap-3.5 shadow-sm transition-all ${
          allOperational 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-glow-operational' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {allOperational ? (
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 relative">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 animate-pulse-ring" />
              <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-slate-950 relative z-10" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 relative">
              <span className="absolute inset-0 rounded-full bg-rose-400 opacity-30 animate-pulse-ring" />
              <AlertCircle className="w-5 h-5 fill-rose-500 text-slate-950 relative z-10" />
            </div>
          )}
          <span className="text-base font-bold font-sans text-foreground">
            {allOperational ? 'All Systems Operational' : 'Partial Outage Detected'}
          </span>
        </div>

        {/* Description Section Box */}
        {config.description && (
          <div>
            <span className="block text-xs font-semibold text-muted-foreground mb-1.5 font-sans">
              Description:
            </span>
            <div className="w-full p-3.5 rounded-xl bg-card border border-border text-xs text-foreground min-h-[44px] shadow-2xs">
              {config.description}
            </div>
          </div>
        )}

        {/* Add Group Button (Editor mode) */}
        {viewMode === 'editor' && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleAddGroup}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Group</span>
            </button>
          </div>
        )}

        {/* Group Cards */}
        {config.groups && config.groups.length > 0 ? (
          <div className="space-y-6">
            {config.groups.map(group => {
              const isExpanded = expandedGroups[group.id] !== false;
              const groupMonitors = monitors.filter(m => group.monitorIds.includes(m.id));

              return (
                <div key={group.id} className="space-y-3">
                  {/* Group Title Row */}
                  <div className="flex items-center gap-2">
                    {viewMode === 'editor' && (
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-rose-500 hover:text-rose-400 p-0.5 transition-colors"
                        title="Delete group"
                      >
                        <X className="w-4 h-4 stroke-[3]" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !isExpanded }))}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>

                    {viewMode === 'editor' ? (
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                        className="bg-card border border-border text-foreground text-sm font-bold px-3 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-sans shadow-2xs"
                      />
                    ) : (
                      <h3 className="text-sm font-bold text-foreground font-sans px-1">
                        {group.name}
                      </h3>
                    )}
                  </div>

                  {/* Group Monitor Rows */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {groupMonitors.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                          No monitors assigned to this group yet.
                        </div>
                      ) : (
                        groupMonitors.map(m => {
                          const uptimeVal = m.uptime24h || 100;
                          const heartbeats = m.heartbeats || [];
                          const isDown = m.status === 'down';

                          // Slice heartbeats (35 or 1 based on toggle)
                          const barsCount = config.showOnlyLastHeartbeat ? 1 : 35;
                          const bars = heartbeats.length > 0 
                            ? heartbeats.slice(-barsCount)
                            : Array.from({ length: barsCount }, () => ({ status: 'up', ping: 25 }));

                          return (
                            <div
                              key={m.id}
                              className="bg-card hover:bg-muted/30 border border-border rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shadow-2xs group"
                            >
                              {/* Left Controls & Info */}
                              <div className="flex items-center gap-3">
                                {viewMode === 'editor' && (
                                  <>
                                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                                    <button
                                      onClick={() => handleRemoveMonitorFromGroup(group.id, m.id)}
                                      className="text-rose-500/80 hover:text-rose-400 transition-colors p-0.5"
                                      title="Remove from group"
                                    >
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <Settings className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                                  </>
                                )}

                                {/* Status pulse dot */}
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  isDown ? 'bg-destructive animate-ping' : 'bg-emerald-500'
                                }`} />

                                {/* Uptime Percentage Badge */}
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  uptimeVal >= 99 
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}>
                                  {uptimeVal.toFixed(2).replace(/\.00$/, '')}%
                                </span>

                                {/* Monitor Name & optional Tags */}
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
                                      <span>SSL Valid (84d)</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Heartbeat Bars with 35m / now labels */}
                              <div className="flex items-center gap-2 relative">
                                {!config.showOnlyLastHeartbeat && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    35m
                                  </span>
                                )}

                                <div className="flex items-center gap-[2px]">
                                  {bars.map((hb, idx) => (
                                    <div
                                      key={idx}
                                      onMouseEnter={() => setHoveredBar({ mId: m.id, idx, ...hb })}
                                      onMouseLeave={() => setHoveredBar(null)}
                                      className={`w-[4px] h-4 rounded-[1px] cursor-pointer transition-all duration-150 hover:scale-y-125 hover:brightness-125 ${
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

                      {/* Dropdown to add unassigned monitors to this group (Editor mode) */}
                      {viewMode === 'editor' && (
                        <div className="pt-1 flex items-center gap-2">
                          <select
                            value={selectedMonitorToAdd}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddMonitorToGroup(group.id, e.target.value);
                              }
                            }}
                            className="bg-card border border-border text-foreground text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs font-mono"
                          >
                            <option value="">+ Add Monitor to {group.name}...</option>
                            {monitors
                              .filter(m => !group.monitorIds.includes(m.id))
                              .map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.type})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            No monitor groups created yet. Click "+ Add Group" to organize your services.
          </div>
        )}

        {/* Custom Footer Section */}
        <div className="pt-6 space-y-2">
          {viewMode === 'editor' && (
            <span className="block text-xs font-semibold text-muted-foreground font-sans">
              Custom Footer:
            </span>
          )}
          <div className="w-full p-4 rounded-xl bg-card border border-border text-center text-xs text-foreground font-mono shadow-2xs">
            {config.footerText || 'Developed By Suhar Yaseen'}
          </div>

          {/* Subfooter: Powered by, Last updated, Countdown timer */}
          <div className="text-center space-y-1 pt-3 text-[11px] text-muted-foreground">
            {config.showPoweredBy && (
              <div>
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
            <div>
              Last Updated: {formatDateTime(lastUpdated)}
            </div>
            <div className="text-muted-foreground/70 font-mono">
              Refresh in: {formatCountdown(countdown)}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Modal */}
      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSave={handleCreateIncident}
      />
    </div>
  );
}
