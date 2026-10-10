import React, { useState, useEffect } from 'react';
import { X, Globe, HardDrive, Cpu, Activity, Server, Send, Settings, Check } from 'lucide-react';

export default function EditMonitorModal({
  isOpen,
  onClose,
  monitor,
  onSave,
  onOpenGlobalTelegram
}) {
  const isEditing = Boolean(monitor && monitor.id);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('http');
  const [url, setUrl] = useState('https://');
  const [target, setTarget] = useState('C:');
  const [threshold, setThreshold] = useState(90);
  const [interval, setInterval] = useState(50);
  const [retries, setRetries] = useState(0);
  const [timeout, setTimeoutVal] = useState(16);
  const [resendNotification, setResendNotification] = useState(0);

  // Per-monitor Telegram settings
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [customChatId, setCustomChatId] = useState('');
  const [showChatIdInput, setShowChatIdInput] = useState(false);

  // HTTP Options
  const [httpMethod, setHttpMethod] = useState('GET');
  const [bodyEncoding, setBodyEncoding] = useState('JSON');
  const [httpBody, setHttpBody] = useState('');

  // Available host drives
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch system drives
      fetch('/api/system/drives')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setDrives(data);
          }
        })
        .catch(console.error);

      if (monitor) {
        setName(monitor.name || '');
        setType(monitor.type || 'http');
        setUrl(monitor.url || 'https://');
        setTarget(monitor.target || 'C:');
        setThreshold(monitor.threshold ?? 90);
        setInterval(monitor.interval || 50);
        setRetries(monitor.retries || 0);
        setTelegramEnabled(monitor.telegramEnabled !== false);
        setCustomChatId(monitor.telegramChatId || '');
        setShowChatIdInput(Boolean(monitor.telegramChatId));
      } else {
        setName('');
        setType('http');
        setUrl('https://');
        setTarget('C:');
        setThreshold(90);
        setInterval(50);
        setRetries(0);
        setTelegramEnabled(true);
        setCustomChatId('');
        setShowChatIdInput(false);
      }
    }
  }, [isOpen, monitor]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: monitor?.id,
      name: name || (type === 'disk' ? `Disk (${target})` : 'New Monitor'),
      type,
      url: type === 'http' || type === 'port' ? url : '',
      target: type === 'disk' ? target : '',
      threshold: Number(threshold),
      interval: Number(interval),
      retries: Number(retries),
      telegramEnabled,
      telegramChatId: customChatId.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none overflow-y-auto">
      <div className="bg-[#0f172a] border border-[#1e2b45] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1b253b]">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isEditing ? 'Edit' : 'Add New Monitor'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Form matching Uptime Kuma screenshot */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* LEFT COLUMN: General */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-200">General</h3>

              {/* Monitor Type */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Monitor Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="http">HTTP(s)</option>
                  <option value="disk">Disk Space (Host)</option>
                  <option value="cpu">CPU Usage (Host)</option>
                  <option value="memory">RAM Memory (Host)</option>
                  <option value="port">TCP Port</option>
                </select>
              </div>

              {/* Friendly Name */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Friendly Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. acad"
                  className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* URL or Disk Path */}
              {type === 'http' || type === 'port' ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://academy.emlylabs.com/"
                    className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              ) : type === 'disk' ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Partition / Drive</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    {drives.map((d, i) => (
                      <option key={i} value={d.mount}>
                        {d.mount} ({Math.round(d.size / 1e9)} GB total, currently {d.usePercent}% used)
                      </option>
                    ))}
                    {drives.length === 0 && <option value="C:">C: Drive</option>}
                  </select>
                </div>
              ) : null}

              {/* Heartbeat Interval */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Heartbeat Interval <span className="text-slate-400 font-normal">(Check every {interval} seconds)</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">{interval} seconds</span>
              </div>

              {/* Retries */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Retries</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={retries}
                  onChange={(e) => setRetries(e.target.value)}
                  className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Maximum retries before the service is marked as down and a notification is sent
                </span>
              </div>

              {/* Request Timeout */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Request Timeout <span className="text-slate-400 font-normal">(Timeout after {timeout} seconds)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(e.target.value)}
                  className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Resend Notification */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Resend Notification if Down X times consecutively <span className="text-slate-400 font-normal">(Resend disabled)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={resendNotification}
                  onChange={(e) => setResendNotification(e.target.value)}
                  className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Notifications & Options */}
            <div className="space-y-6">
              {/* Notifications Section */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-200">Notifications</h3>

                {/* Telegram Toggle (Exact match to screenshot) */}
                <div className="p-3 bg-[#131e33] border border-[#202f4c] rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Pill toggle */}
                      <button
                        type="button"
                        onClick={() => setTelegramEnabled(!telegramEnabled)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          telegramEnabled ? 'bg-[#22c55e]' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            telegramEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold text-slate-200">
                        My Telegram Alert (1)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChatIdInput(!showChatIdInput)}
                        className="text-[11px] text-blue-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      telegramEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {telegramEnabled ? 'Active for this monitor' : 'Disabled'}
                    </span>
                  </div>

                  {/* Per-Monitor Specific Chat ID override */}
                  {showChatIdInput && (
                    <div className="pt-2 border-t border-[#1e2a42] space-y-1">
                      <label className="block text-[11px] text-slate-300">
                        Specific Telegram Chat ID for this monitor <span className="text-slate-500">(Optional override)</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank to use global Chat ID, or enter -100... for team group"
                        value={customChatId}
                        onChange={(e) => setCustomChatId(e.target.value)}
                        className="w-full bg-[#0f172a] text-slate-200 border border-[#202f4a] rounded px-2.5 py-1.5 font-mono text-[11px] focus:outline-none focus:border-blue-500/50"
                      />
                      <span className="text-[10px] text-slate-400">
                        Routes alerts for this specific monitor to a dedicated channel, user, or group.
                      </span>
                    </div>
                  )}
                </div>

                {/* Set Up Notification Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGlobalTelegram();
                  }}
                  className="px-4 py-2 rounded-md bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-500/10"
                >
                  Set Up Notification
                </button>
              </div>

              {/* Proxy Section */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-200">Proxy</h3>
                <p className="text-[11px] text-slate-400">Not available, please set up.</p>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 font-bold text-xs tracking-wide transition-all"
                >
                  Set Up Proxy
                </button>
              </div>

              {/* HTTP Options OR Threshold for Hardware */}
              {type === 'http' ? (
                <div className="space-y-3 pt-2">
                  <h3 className="text-base font-semibold text-slate-200">HTTP Options</h3>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Method</label>
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value)}
                      className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="HEAD">HEAD</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Body Encoding</label>
                    <select
                      value={bodyEncoding}
                      onChange={(e) => setBodyEncoding(e.target.value)}
                      className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="JSON">JSON</option>
                      <option value="XML">XML</option>
                      <option value="Plain Text">Plain Text</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Body</label>
                    <textarea
                      rows={3}
                      value={httpBody}
                      onChange={(e) => setHttpBody(e.target.value)}
                      placeholder={'Example:\n{\n  "key": "value"\n}'}
                      className="w-full bg-[#121c30] text-slate-200 border border-[#202f4a] rounded-md p-2.5 font-mono text-[11px] focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <h3 className="text-base font-semibold text-slate-200">Hardware Threshold</h3>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Alert Threshold: <strong className="text-emerald-400">{threshold}%</strong>
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
                      Sends Telegram alert and marks DOWN if usage crosses {threshold}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Save Button (Matching bottom left green Save button in screenshot) */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#1b253b]">
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Save
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#131d2e] hover:bg-[#19263b] text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
