import React, { useState } from 'react';
import { X, Megaphone, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function IncidentModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [style, setStyle] = useState('warning');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), content, style });
    setTitle('');
    setContent('');
    setStyle('warning');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground font-sans">
              Create Incident
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5 font-sans">
              Incident Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Network Upgrade"
              className="w-full px-3 py-2 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5 font-sans">
              Incident Severity / Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStyle('warning')}
                className={`flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border transition-all ${
                  style === 'warning'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold shadow-xs'
                    : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Warning</span>
              </button>
              <button
                type="button"
                onClick={() => setStyle('danger')}
                className={`flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border transition-all ${
                  style === 'danger'
                    ? 'bg-destructive/15 border-destructive/50 text-destructive font-semibold shadow-xs'
                    : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Major</span>
              </button>
              <button
                type="button"
                onClick={() => setStyle('info')}
                className={`flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border transition-all ${
                  style === 'info'
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 font-semibold shadow-xs'
                    : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Notice</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5 font-sans">
              Incident Details / Markdown
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the incident, impacts, and expected recovery time..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
            >
              Post Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
