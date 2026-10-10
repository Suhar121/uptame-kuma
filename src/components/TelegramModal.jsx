import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, HelpCircle, Bell } from 'lucide-react';

export default function TelegramModal({ isOpen, onClose }) {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(r => r.json())
        .then(data => {
          if (data.telegram) {
            setBotToken(data.telegram.botToken || '');
            setChatId(data.telegram.chatId || '');
            setEnabled(data.telegram.enabled ?? true);
          }
        })
        .catch(console.error);
      setTestResult(null);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: 'Test message sent! Check your Telegram.' });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test message' });
      }
    } catch (e) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram: {
            enabled,
            botToken,
            chatId
          }
        })
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#0f1728] border border-[#1f2b45] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1b253b]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Send className="w-4 h-4 -rotate-45 ml-0.5" />
            </div>
            <h2 className="text-base font-semibold text-white">Setup Telegram Notifications</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#131d2e] border border-[#1f2a40]">
            <div>
              <span className="font-semibold text-white block">Enable Telegram Alerts</span>
              <span className="text-[11px] text-slate-400">Send notifications when services go DOWN or UP</span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                enabled ? 'bg-[#22c55e]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bot Token */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Telegram Bot Token
            </label>
            <input
              type="text"
              required={enabled}
              placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full bg-[#121a2c] text-slate-200 border border-[#1f2b45] rounded-md px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Chat ID */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Telegram Chat ID
            </label>
            <input
              type="text"
              required={enabled}
              placeholder="e.g. 123456789 or -1001234567890 for groups"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full bg-[#121a2c] text-slate-200 border border-[#1f2b45] rounded-md px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Step-by-Step Instructions */}
          <div className="p-3 bg-[#11192a] border border-[#1a253c] rounded-md text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>How to get your Bot Token & Chat ID:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Open Telegram and search for <strong>@BotFather</strong>.</li>
              <li>Send <code>/newbot</code>, follow the prompt, and copy the <strong>HTTP API Token</strong>.</li>
              <li>Open your newly created bot in Telegram and click <strong>Start</strong>.</li>
              <li>To get your <strong>Chat ID</strong>, search for <strong>@userinfobot</strong> and send <code>/start</code>.</li>
            </ol>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-2.5 rounded-md flex items-center gap-2 text-xs ${
                testResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1b253b]">
            <button
              type="button"
              disabled={!botToken || !chatId || testing}
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#162238] hover:bg-[#1e2e4a] text-blue-400 disabled:opacity-50 transition-colors font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? 'Sending Test...' : 'Test Notification'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-[#131d2e] hover:bg-[#19263b] text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-[#22c55e] hover:bg-[#16a34a] text-slate-950 font-bold"
              >
                {saved ? 'Saved!' : 'Save Notification'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
