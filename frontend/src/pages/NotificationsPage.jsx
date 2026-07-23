import { useState, useEffect } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = () => {
    setLoading(true);
    setError(null);
    api.get('/notifications')
      .then((r) => setNotifications(r.data))
      .catch((e) => { setError(e.response?.data?.error || 'Failed to load notifications'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="space-y-3"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded skeleton-shimmer w-1/3" /><div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton-shimmer" /><div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton-shimmer" /><div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl skeleton-shimmer" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All notifications</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Mark all as read</button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchNotifications} className="text-sm font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n._id} className={`rounded-2xl bg-white dark:bg-gray-900 border shadow-sm p-5 flex items-start justify-between gap-4 transition-all duration-200 ${!n.read ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{n.message}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              {n.link && <a href={n.link} className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 mt-1 inline-block transition-colors">View details</a>}
            </div>
            <div className="flex gap-2 shrink-0 items-start">
              {!n.read && (
                <button onClick={() => markRead(n._id)} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Mark read</button>
              )}
              <button onClick={() => handleDelete(n._id)} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
