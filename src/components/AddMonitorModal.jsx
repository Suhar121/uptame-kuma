import React, { useState, useEffect } from 'react';
import { X, HardDrive, Globe, Server, Cpu, Activity } from 'lucide-react';

export default function AddMonitorModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('disk'); // Default to disk as requested!
  const [url, setUrl] = useState('https://');
  const [target, setTarget] = useState('C:');
  const [threshold, setThreshold] = useState(90);
  const [interval, setInterval] = useState(30);
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch available local drives
      fetch('/api/system/drives')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDrives(data);
            setTarget(data[0].mount);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      name: name || (type === 'disk' ? `Disk (${target})` : 'New Monitor'),
      type,
      url: type === 'http' || type === 'port' ? url : '',
      target: type === 'disk' ? target : '',
      threshold: Number(threshold),
      interval: Number(interval)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#0f1728] border border-[#1f2b45] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b253b]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Add New Monitor</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Monitor Type */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Monitor Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'disk', label: 'Disk Space', icon: HardDrive },
                { id: 'cpu', label: 'CPU Load', icon: Cpu },
                { id: 'memory', label: 'RAM Memory', icon: Activity },
                { id: 'http', label: 'HTTP(s)', icon: Globe },
                { id: 'port', label: 'TCP Port', icon: Server },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`flex items-center gap-1.5 p-2.5 rounded-md border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'border-[#1f2a40] bg-[#131c2e] text-slate-300 hover:bg-[#18233a]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Friendly Name</label>
            <input
              type="text"
              placeholder={type === 'disk' ? 'e.g. Server Disk (C:)' : 'e.g. My Web API'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#121a2c] text-slate-200 border border-[#1f2b45] rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Specific Inputs per Type */}
          {type === 'disk' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Select Drive / Partition</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-[#121a2c] text-slate-200 border border-[#1f2b45] rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500/50"
              >
                {drives.map((d, i) => (
                  <option key={i} value={d.mount}>
                    {d.mount} ({Math.round(d.size / 1e9)} GB, currently {d.usePercent}% used)
                  </option>
                ))}
                {drives.length === 0 && <option value="C:">C: (Default)</option>}
              </select>
            </div>
          )}

          {['disk', 'cpu', 'memory'].includes(type) && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Alert Threshold ({threshold}%)
              </label>
              <input
                type="range"
                min="50"
                max="99"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                Trigger DOWN incident if usage crosses {threshold}%
              </span>
            </div>
          )}

          {(type === 'http' || type === 'port') && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {type === 'http' ? 'Target URL' : 'Host:Port (e.g. 192.168.1.1:5432)'}
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#121a2c] text-slate-200 border border-[#1f2b45] rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
          )}

          {/* Interval */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Heartbeat Check Interval (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="300"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full bg-[#121a2c] text-slate-200 border border-[#1f2b45] rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1b253b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#131d2e] hover:bg-[#19263b] text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-[#20c997] hover:bg-[#1ba87e] text-slate-950 font-bold"
            >
              Save Monitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
