import { useState, useEffect } from 'react';
import api from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
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

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Mark all as read</button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchNotifications} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n._id} className={`bg-white rounded-xl shadow-sm border p-4 flex items-start justify-between gap-4 ${!n.read ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'}`}>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              {n.link && <a href={n.link} className="text-xs text-primary-600 hover:text-primary-800 mt-1 inline-block">View details</a>}
            </div>
            <div className="flex gap-2 shrink-0">
              {!n.read && (
                <button onClick={() => markRead(n._id)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">Mark read</button>
              )}
              <button onClick={() => handleDelete(n._id)} className="text-xs text-red-600 hover:text-red-800 font-medium">Delete</button>
            </div>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-center text-gray-500 py-12">No notifications</p>}
      </div>
    </div>
  );
}
