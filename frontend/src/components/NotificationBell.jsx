import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import useWebSocket from '../hooks/useWebSocket';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const r = await api.get('/notifications/unread-count');
      setCount(r.data.count);
    } catch {}
  };

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const r = await api.get('/notifications?limit=5&unreadOnly=true');
      setNotifications(r.data);
    } catch {}
    setLoading(false);
  };

  const handleIncomingNotification = useCallback((data) => {
    setCount((c) => c + 1);
    setNotifications((prev) => [data, ...prev].slice(0, 5));
  }, []);

  useWebSocket(handleIncomingNotification);

  useEffect(() => {
    fetchCount();
  }, []);

  useEffect(() => {
    if (open) fetchRecent();
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={handleViewAll} className="text-xs text-primary-600 hover:text-primary-800 font-medium">View all</button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 flex-1">{n.message}</p>
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="text-xs text-primary-600 hover:text-primary-800 shrink-0 mt-0.5"
                    >
                      Mark read
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
