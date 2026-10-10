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
      <div className="bg-card border border-border rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-scale-up text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground tracking-tight font-sans">
            {isEditing ? 'Edit Monitor' : 'Add New Monitor'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Form matching Uptime Kuma screenshot */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            {/* LEFT COLUMN: General */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground font-sans">General</h3>

              {/* Monitor Type */}
              <div>
                <label className="block text-muted-foreground font-medium mb-1.5">Monitor Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
                <label className="block text-muted-foreground font-medium mb-1">Friendly Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. acad"
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* URL or Disk Path */}
              {type === 'http' || type === 'port' ? (
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://academy.emlylabs.com/"
                    className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ) : type === 'disk' ? (
                <div>
                  <label className="block text-muted-foreground font-medium mb-1">Partition / Drive</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
                <label className="block text-muted-foreground font-medium mb-1">
                  Heartbeat Interval <span className="opacity-70 font-normal">(Check every {interval}s)</span>
                </label>
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-[11px] text-muted-foreground/70 mt-0.5 block">{interval} seconds</span>
              </div>

              {/* Retries */}
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Retries</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={retries}
                  onChange={(e) => setRetries(e.target.value)}
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-[11px] text-muted-foreground/70 mt-0.5 block">
                  Maximum retries before marked as down and sending alerts
                </span>
              </div>

              {/* Request Timeout */}
              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Request Timeout <span className="opacity-70 font-normal">(Timeout after {timeout}s)</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(e.target.value)}
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Resend Notification */}
              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Resend Notification if Down X times consecutively
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={resendNotification}
                  onChange={(e) => setResendNotification(e.target.value)}
                  className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Notifications & Options */}
            <div className="space-y-6">
              {/* Notifications Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground font-sans">Notifications</h3>

                {/* Telegram Toggle (Darkmatter style) */}
                <div className="p-3.5 bg-muted/30 border border-border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setTelegramEnabled(!telegramEnabled)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          telegramEnabled ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            telegramEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-semibold text-foreground">
                        My Telegram Alert (1)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChatIdInput(!showChatIdInput)}
                        className="text-[11px] text-secondary hover:underline ml-1"
                      >
                        Edit
                      </button>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      telegramEnabled ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {telegramEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Per-Monitor Specific Chat ID override */}
                  {showChatIdInput && (
                    <div className="pt-2 border-t border-border space-y-1">
                      <label className="block text-[11px] text-muted-foreground">
                        Specific Telegram Chat ID for this monitor:
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank for global, or enter -100... for team group"
                        value={customChatId}
                        onChange={(e) => setCustomChatId(e.target.value)}
                        className="w-full bg-input text-foreground border border-border rounded-lg px-2.5 py-1.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                      />
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
                  className="px-4 py-2 rounded-lg bg-primary hover:brightness-110 text-primary-foreground font-semibold text-xs tracking-wide transition-all shadow-sm"
                >
                  Set Up Notification
                </button>
              </div>

              {/* Proxy Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground font-sans">Proxy</h3>
                <p className="text-[11px] text-muted-foreground">Not available, please set up.</p>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs transition-colors border border-border"
                >
                  Set Up Proxy
                </button>
              </div>

              {/* HTTP Options OR Threshold for Hardware */}
              {type === 'http' ? (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-foreground font-sans">HTTP Options</h3>
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Method</label>
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value)}
                      className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="HEAD">HEAD</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Body Encoding</label>
                    <select
                      value={bodyEncoding}
                      onChange={(e) => setBodyEncoding(e.target.value)}
                      className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="JSON">JSON</option>
                      <option value="XML">XML</option>
                      <option value="Plain Text">Plain Text</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">Body</label>
                    <textarea
                      rows={3}
                      value={httpBody}
                      onChange={(e) => setHttpBody(e.target.value)}
                      placeholder={'Example:\n{\n  "key": "value"\n}'}
                      className="w-full bg-input text-foreground border border-border rounded-lg p-2.5 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-foreground font-sans">Hardware Threshold</h3>
                  <div>
                    <label className="block text-muted-foreground font-medium mb-1">
                      Alert Threshold: <strong className="text-primary font-mono">{threshold}%</strong>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="99"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Sends Telegram alert and marks DOWN if usage crosses {threshold}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-primary hover:brightness-110 text-primary-foreground font-semibold text-xs tracking-wide shadow-sm transition-all cursor-pointer"
            >
              Save
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs transition-colors border border-border"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
