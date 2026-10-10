import React, { useState } from 'react';
import { Plus, Search, ChevronDown, Check } from 'lucide-react';
import HeartbeatStrip from './HeartbeatStrip';

export default function Sidebar({
  monitors = [],
  selectedId,
  onSelect,
  onOpenAddModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, up, down
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const filteredMonitors = monitors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.url && m.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (m.tag && m.tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Top Add Button */}
      <div className="p-3 pb-2">
        <button
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary hover:brightness-110 text-primary-foreground font-semibold text-xs tracking-wide transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Monitor</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-3 py-2 space-y-2 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-xs">
          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-[11px] transition-colors"
            >
              <span>Status</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {showStatusMenu && (
              <div className="absolute left-0 mt-1 w-28 bg-popover border border-border rounded-lg shadow-md z-20 py-1 text-xs">
                {['all', 'up', 'down'].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setStatusFilter(st); setShowStatusMenu(false); }}
                    className="w-full text-left px-3 py-1.5 capitalize hover:bg-accent text-foreground flex items-center justify-between"
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags Filter */}
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-[11px] transition-colors">
            <span>Tags</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search monitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input text-xs text-foreground placeholder-muted-foreground pl-8 pr-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-ring transition-all"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Monitors List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredMonitors.map((m) => {
          const isSelected = m.id === selectedId;
          const isDown = m.status === 'down';
          const badgeClass = isDown
            ? 'bg-destructive/15 text-destructive border-destructive/30'
            : 'bg-primary/15 text-primary border-primary/30';

          return (
            <div
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-accent/80 border border-sidebar-border text-foreground shadow-xs'
                  : 'hover:bg-muted/40 border border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {/* Left pill & title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                  {m.uptime24h || 100}%
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-foreground truncate block font-sans">
                    {m.name}
                  </span>
                  {m.type === 'disk' && (
                    <span className="text-[10px] text-muted-foreground block -mt-0.5">
                      Disk ({m.target || 'C:'})
                    </span>
                  )}
                </div>
              </div>

              {/* Mini Heartbeat Bar */}
              <div className="flex-shrink-0 ml-2">
                <HeartbeatStrip heartbeats={m.heartbeats || []} size="small" />
              </div>
            </div>
          );
        })}

        {filteredMonitors.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No monitors found
          </div>
        )}
      </div>
    </aside>
  );
}
