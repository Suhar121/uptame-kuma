import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center border border-secondary/30 shadow-xs">
              <Send className="w-4 h-4 -rotate-45 ml-0.5" />
            </div>
            <h2 className="text-base font-bold text-foreground font-sans">Telegram Notifications</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border">
            <div>
              <span className="font-semibold text-foreground block font-sans">Enable Telegram Alerts</span>
              <span className="text-[11px] text-muted-foreground">Send notifications when services transition DOWN or UP</span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                enabled ? 'bg-primary' : 'bg-muted'
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
            <label className="block text-muted-foreground font-medium mb-1">
              Telegram Bot Token
            </label>
            <input
              type="text"
              required={enabled}
              placeholder="e.g. 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Chat ID */}
          <div>
            <label className="block text-muted-foreground font-medium mb-1">
              Telegram Chat ID
            </label>
            <input
              type="text"
              required={enabled}
              placeholder="e.g. 123456789 or -1001234567890 for groups"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full bg-input text-foreground border border-border rounded-lg px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Step-by-Step Instructions */}
          <div className="p-3.5 bg-muted/30 border border-border rounded-xl text-[11px] text-muted-foreground space-y-1.5 leading-relaxed">
            <div className="font-semibold text-foreground flex items-center gap-1.5 font-sans">
              <HelpCircle className="w-3.5 h-3.5 text-secondary" />
              <span>How to get your Bot Token & Chat ID:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open Telegram and search for <strong>@BotFather</strong>.</li>
              <li>Send <code>/newbot</code> and copy your <strong>HTTP API Token</strong>.</li>
              <li>Start your new bot in Telegram (click <strong>Start</strong>).</li>
              <li>Get your <strong>Chat ID</strong> by searching for <strong>@userinfobot</strong> and clicking start.</li>
            </ol>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 text-xs border ${
                testResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-destructive/15 border-destructive/30 text-destructive'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <button
              type="button"
              disabled={!botToken || !chatId || testing}
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30 disabled:opacity-50 transition-colors font-semibold shadow-xs"
            >
              <Send className="w-3.5 h-3.5 -rotate-45" />
              <span>{testing ? 'Sending Test...' : 'Test Notification'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-primary hover:brightness-110 text-primary-foreground font-semibold text-xs tracking-wide shadow-sm"
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
