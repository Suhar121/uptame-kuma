import React, { useState } from 'react';
import { Plus, Search, ChevronDown, Check, Filter } from 'lucide-react';
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
    <aside className="w-80 bg-[#0d1422] border-r border-[#19243a] flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Top Add Button */}
      <div className="p-3 pb-2">
        <button
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Monitor</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-3 py-2 space-y-2 border-b border-[#162035]">
        <div className="flex items-center gap-2 text-xs">
          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131d2f] hover:bg-[#18243a] text-slate-300 border border-[#1e2a42] text-[11px]"
            >
              <span>Status</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showStatusMenu && (
              <div className="absolute left-0 mt-1 w-28 bg-[#111a2c] border border-[#202d47] rounded shadow-xl z-20 py-1 text-xs">
                {['all', 'up', 'down'].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setStatusFilter(st); setShowStatusMenu(false); }}
                    className="w-full text-left px-3 py-1.5 capitalize hover:bg-[#19263f] flex items-center justify-between text-slate-200"
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags Filter */}
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131d2f] hover:bg-[#18243a] text-slate-300 border border-[#1e2a42] text-[11px]">
            <span>Tags</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111a2c] text-xs text-slate-200 placeholder-slate-500 pl-7 pr-3 py-1.5 rounded border border-[#1d2941] focus:outline-none focus:border-emerald-500/50"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>
      </div>

      {/* Monitors List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredMonitors.map((m) => {
          const isSelected = m.id === selectedId;
          const isDown = m.status === 'down';
          const badgeBg = isDown ? 'bg-[#ef4444]' : 'bg-[#22c55e]';
          const badgeText = 'text-slate-950 font-bold';

          return (
            <div
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`p-2.5 rounded-md cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-[#182338] border border-[#233350]'
                  : 'hover:bg-[#121b2d] border border-transparent'
              }`}
            >
              {/* Left pill & title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
                  {m.uptime24h || 100}%
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-slate-200 truncate block">
                    {m.name}
                  </span>
                  {m.type === 'disk' && (
                    <span className="text-[10px] text-slate-400 block -mt-0.5">
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
          <div className="p-4 text-center text-xs text-slate-500">
            No monitors found
          </div>
        )}
      </div>
    </aside>
  );
}
