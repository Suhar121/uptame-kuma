import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MonitorDetail from './components/MonitorDetail';
import EditMonitorModal from './components/EditMonitorModal';
import StatusPage from './components/StatusPage';
import TelegramModal from './components/TelegramModal';

export default function App() {
  const [monitors, setMonitors] = useState([]);
  const [selectedId, setSelectedId] = useState('1'); // Default to Ops #1
  const [currentView, setCurrentView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [hostInfo, setHostInfo] = useState(null);
  const wsRef = useRef(null);

  // Load monitors and host info
  useEffect(() => {
    fetch('/api/monitors')
      .then(res => res.json())
      .then(data => {
        setMonitors(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      })
      .catch(console.error);

    fetch('/api/system/overview')
      .then(res => res.json())
      .then(data => setHostInfo(data))
      .catch(console.error);
  }, []);

  // Setup WebSocket connection for live heartbeats
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    function connectWs() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          if (type === 'INIT') {
            setMonitors(payload.monitors);
          } else if (type === 'HEARTBEAT') {
            setMonitors(prev => prev.map(m => m.id === payload.monitorId ? payload.monitor : m));
          } else if (type === 'MONITOR_ADDED') {
            setMonitors(prev => [...prev, payload]);
          } else if (type === 'MONITOR_DELETED') {
            setMonitors(prev => prev.filter(m => m.id !== payload.id));
          } else if (type === 'MONITOR_UPDATED') {
            setMonitors(prev => prev.map(m => m.id === payload.id ? payload : m));
          }
        } catch (e) {
          console.error('WS Error:', e);
        }
      };

      ws.onclose = () => {
        setTimeout(connectWs, 3000);
      };
    }

    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handlePause = async (id) => {
    try {
      const res = await fetch(`/api/monitors/${id}/pause`, { method: 'POST' });
      const updated = await res.json();
      setMonitors(prev => prev.map(m => m.id === id ? updated : m));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTelegram = async (id) => {
    try {
      const res = await fetch(`/api/monitors/${id}/toggle-telegram`, { method: 'POST' });
      const updated = await res.json();
      setMonitors(prev => prev.map(m => m.id === id ? updated : m));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this monitor?')) {
      try {
        await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
        setMonitors(prev => prev.filter(m => m.id !== id));
        if (selectedId === id) {
          const remaining = monitors.filter(m => m.id !== id);
          if (remaining.length > 0) setSelectedId(remaining[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearData = async (id) => {
    try {
      await fetch(`/api/monitors/${id}/clear`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClone = async (monitor) => {
    try {
      const cloned = {
        ...monitor,
        name: `${monitor.name} (Clone)`,
        tag: `${monitor.tag || monitor.name} (Clone)`
      };
      delete cloned.id;
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloned)
      });
      const created = await res.json();
      setSelectedId(created.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMonitor = async (data) => {
    try {
      if (data.id) {
        // Edit existing monitor
        const res = await fetch(`/api/monitors/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const updated = await res.json();
        setMonitors(prev => prev.map(m => m.id === data.id ? updated : m));
      } else {
        // Create new monitor
        const res = await fetch('/api/monitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const created = await res.json();
        setSelectedId(created.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedMonitor = monitors.find(m => m.id === selectedId) || monitors[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0c1322] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        hostInfo={hostInfo}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
      />

      {/* Main Body */}
      {currentView === 'dashboard' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            monitors={monitors}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onOpenAddModal={() => {
              setEditingMonitor(null);
              setIsModalOpen(true);
            }}
          />

          {/* Right Monitor Detail Pane */}
          <MonitorDetail
            monitor={selectedMonitor}
            onPause={handlePause}
            onDelete={handleDelete}
            onClearData={handleClearData}
            onClone={handleClone}
            onEdit={(m) => {
              setEditingMonitor(m);
              setIsModalOpen(true);
            }}
            onToggleTelegram={handleToggleTelegram}
          />
        </div>
      ) : (
        <StatusPage
          monitors={monitors}
          onBackToDashboard={() => setCurrentView('dashboard')}
        />
      )}

      {/* Add / Edit Monitor Modal (with Per-Monitor Telegram Settings) */}
      <EditMonitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        monitor={editingMonitor}
        onSave={handleSaveMonitor}
        onOpenGlobalTelegram={() => setIsTelegramModalOpen(true)}
      />

      {/* Global Telegram Setup Modal */}
      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </div>
  );
}
