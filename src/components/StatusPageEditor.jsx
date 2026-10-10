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
  Globe
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

  // Check overall health based on monitors in groups
  const groupMonitorIds = (config.groups || []).flatMap(g => g.monitorIds);
  const activeGroupMonitors = monitors.filter(m => groupMonitorIds.includes(m.id));
  const hasDownMonitors = activeGroupMonitors.some(m => m.status === 'down');
  const allOperational = activeGroupMonitors.length > 0 ? !hasDownMonitors : true;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#0b0f19] text-slate-100 min-h-[calc(100vh-3.5rem)] font-mono overflow-y-auto">
      {/* =========================================================================
          LEFT COLUMN: STATUS PAGE SETTINGS & CONTROLS (Matches Screenshot)
          ========================================================================= */}
      <div className="w-full lg:w-[320px] xl:w-[350px] bg-[#0e1422] border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-4">
          {/* Header Title & Discard/Save indicator */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 font-sans uppercase tracking-wider">
              Status Page Settings
            </span>
            {saveStatus === 'saved' && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved!
              </span>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-sans">
              Slug
            </label>
            <div className="flex rounded-md bg-[#161f30] border border-slate-700 overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
              <span className="px-2.5 py-1.5 text-xs text-slate-400 bg-slate-800/50 border-r border-slate-700 select-none">
                /status/
              </span>
              <input
                type="text"
                value={config.slug}
                onChange={(e) => setConfig({ ...config, slug: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
                placeholder="monitor"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-sans">
              Title
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[#161f30] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="monitor"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-sans">
              Description
            </label>
            <textarea
              rows={3}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[#161f30] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="hahhaah"
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">
              Markdown syntax supported. If using HTML, avoid leading spaces to prevent formatting issues.
            </p>
          </div>

          {/* Footer Text */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-sans">
              Footer Text
            </label>
            <textarea
              rows={2}
              value={config.footerText}
              onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[#161f30] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              placeholder="Developed By Suhar Yaseen"
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">
              Markdown syntax supported. If using HTML, avoid leading spaces to prevent formatting issues.
            </p>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-sans">
              Refresh Interval
            </label>
            <input
              type="number"
              value={config.refreshInterval}
              onChange={(e) => setConfig({ ...config, refreshInterval: parseInt(e.target.value) || 300 })}
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[#161f30] border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="300"
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-tight">
              The status page will do a full site refresh every {config.refreshInterval} seconds
            </p>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 font-sans">
              Theme
            </label>
            <select
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[#161f30] border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="auto">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          {/* Toggles / Switches */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            {/* Show Tags */}
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showTags}
                onChange={(e) => setConfig({ ...config, showTags: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
              <span>Show Tags</span>
            </label>

            {/* Show Powered By */}
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showPoweredBy}
                onChange={(e) => setConfig({ ...config, showPoweredBy: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
              <span>Show Powered By</span>
            </label>

            {/* Show Certificate Expiry */}
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showCertificateExpiry}
                onChange={(e) => setConfig({ ...config, showCertificateExpiry: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
              <span>Show Certificate Expiry</span>
            </label>

            {/* Show Only Last Heartbeat */}
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.showOnlyLastHeartbeat}
                onChange={(e) => setConfig({ ...config, showOnlyLastHeartbeat: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500 relative"></div>
              <span>Show Only Last Heartbeat</span>
            </label>
          </div>

          {/* Domain Names */}
          <div className="pt-2">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <span>Domain Names</span>
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Save & Discard Buttons at Bottom */}
        <div className="pt-6 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            onClick={handleDiscard}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-rose-500/90 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: LIVE STATUS PAGE PREVIEW / EDITOR (Matches Screenshot)
          ========================================================================= */}
      <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
        {/* Top Header: Logo + Title + Incidents Button */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            {/* Logo with remove/change icon */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <button
                title="Remove logo"
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center text-[10px]"
              >
                ✖
              </button>
            </div>

            {/* Title display badge */}
            <div className="bg-[#161f30] border border-slate-700/80 px-3.5 py-1.5 rounded-lg text-lg font-bold text-slate-100 font-sans shadow-xs">
              {config.title || 'monitor'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onBackToDashboard && onBackToDashboard()}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Create Incident Button */}
        <div>
          <button
            onClick={() => setIsIncidentModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Create Incident</span>
          </button>
        </div>

        {/* Active Incidents (if any) */}
        {config.incidents && config.incidents.length > 0 && (
          <div className="space-y-3">
            {config.incidents.map(inc => (
              <div
                key={inc.id}
                className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Incident
                    </span>
                    <h4 className="text-sm font-bold text-amber-200 font-sans">{inc.title}</h4>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(inc.createdAt)}
                    </span>
                  </div>
                  {inc.content && (
                    <p className="text-xs text-slate-300 mt-2 font-mono whitespace-pre-wrap">
                      {inc.content}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteIncident(inc.id)}
                  className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                  title="Resolve & Remove Incident"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Big Status Banner: "All Systems Operational" */}
        <div className={`p-4 rounded-xl border flex items-center gap-3.5 shadow-sm ${
          allOperational 
            ? 'bg-[#10241b] border-emerald-500/30 text-emerald-400' 
            : 'bg-[#2b1416] border-rose-500/30 text-rose-400'
        }`}>
          {allOperational ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-slate-950" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5 fill-rose-500 text-slate-950" />
            </div>
          )}
          <span className="text-base font-bold font-sans text-slate-100">
            {allOperational ? 'All Systems Operational' : 'Partial Outage Detected'}
          </span>
        </div>

        {/* Description Section Box */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1 font-sans">
            Description:
          </span>
          <div className="w-full p-3 rounded-lg bg-[#161f30] border border-slate-700/80 text-xs text-slate-200 min-h-[44px]">
            {config.description || <span className="text-slate-500 italic">No description set</span>}
          </div>
        </div>

        {/* Add Group Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleAddGroup}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Group</span>
          </button>
        </div>

        {/* Group Cards */}
        {config.groups && config.groups.length > 0 ? (
          <div className="space-y-6">
            {config.groups.map(group => {
              const isExpanded = expandedGroups[group.id] !== false;
              const groupMonitors = monitors.filter(m => group.monitorIds.includes(m.id));

              return (
                <div key={group.id} className="space-y-3">
                  {/* Group Title Row with Red ✖, Chevron, and Name */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-rose-500 hover:text-rose-400 p-0.5 transition-colors"
                      title="Delete group"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !isExpanded }))}
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                      className="bg-[#161f30] border border-slate-700/80 text-slate-100 text-sm font-bold px-3 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                    />
                  </div>

                  {/* Group Monitor Rows */}
                  {isExpanded && (
                    <div className="space-y-2">
                      {groupMonitors.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                          No monitors available in this group.{' '}
                          <span className="text-emerald-400 cursor-pointer underline">
                            Add one below
                          </span>
                        </div>
                      ) : (
                        groupMonitors.map(m => {
                          const uptimeVal = m.uptime24h || 100;
                          const heartbeats = m.heartbeats || [];
                          // Display 35 bars like screenshot
                          const bars = heartbeats.length > 0 
                            ? heartbeats.slice(-35)
                            : Array.from({ length: 35 }, () => ({ status: 'up' }));

                          return (
                            <div
                              key={m.id}
                              className="bg-[#121927] hover:bg-[#151e2f] border border-slate-800/80 rounded-lg px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors shadow-xs"
                            >
                              {/* Left Controls & Info */}
                              <div className="flex items-center gap-3">
                                {/* Drag Handle */}
                                <GripVertical className="w-3.5 h-3.5 text-slate-500 cursor-grab" />
                                
                                {/* Delete from group */}
                                <button
                                  onClick={() => handleRemoveMonitorFromGroup(group.id, m.id)}
                                  className="text-rose-500/80 hover:text-rose-400 transition-colors p-0.5"
                                  title="Remove from group"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>

                                {/* Settings icon */}
                                <Settings className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors" />

                                {/* Uptime Percentage Badge */}
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  uptimeVal >= 99 
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}>
                                  {uptimeVal.toFixed(2).replace(/\.00$/, '')}%
                                </span>

                                {/* Monitor Name */}
                                <span className="text-xs font-semibold text-slate-200 font-sans">
                                  {m.name}
                                </span>
                              </div>

                              {/* Right: Heartbeat Bars with 35m / now labels */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  35m
                                </span>
                                <div className="flex items-center gap-[2px]">
                                  {bars.map((hb, idx) => (
                                    <div
                                      key={idx}
                                      className={`w-[4px] h-4 rounded-[1px] ${
                                        hb.status === 'down'
                                          ? 'bg-rose-500'
                                          : 'bg-emerald-400'
                                      }`}
                                      title={hb.status === 'down' ? 'Down' : 'Operational'}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  now
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Dropdown to add unassigned monitors to this group */}
                      <div className="pt-1 flex items-center gap-2">
                        <select
                          value={selectedMonitorToAdd}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddMonitorToGroup(group.id, e.target.value);
                            }
                          }}
                          className="bg-[#161f30] border border-slate-700/60 text-slate-300 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
            No monitor groups created yet. Click "+ Add Group" to organize your services.
          </div>
        )}

        {/* Custom Footer Section */}
        <div className="pt-6 space-y-2">
          <span className="block text-xs font-semibold text-slate-400 font-sans">
            Custom Footer:
          </span>
          <div className="w-full p-4 rounded-lg bg-[#161f30] border border-slate-700/80 text-center text-xs text-slate-300 font-mono">
            {config.footerText || 'Developed By Suhar Yaseen'}
          </div>

          {/* Subfooter: Powered by, Last updated, Countdown timer */}
          <div className="text-center space-y-1 pt-3 text-[11px] text-slate-400">
            {config.showPoweredBy && (
              <div>
                Powered by{' '}
                <a
                  href="https://github.com/louislam/uptime-kuma"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  Uptime Kuma
                </a>
              </div>
            )}
            <div>
              Last Updated: {formatDateTime(lastUpdated)}
            </div>
            <div className="text-slate-500 font-mono">
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
