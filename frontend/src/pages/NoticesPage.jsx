import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function NoticesPage() {
  const { user } = useAuth();
  const canPost = user?.type === ROLES.APARTMENT_ADMIN || user?.type === ROLES.COMMITTEE_HEAD;
  const [notices, setNotices] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', committeeId: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/notices')
      .then((r) => setNotices(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load notices');
        toast.error('Failed to load notices');
      });
    if (user?.type === ROLES.APARTMENT_ADMIN) {
      api.get('/apartment/committees')
        .then((r) => setCommittees(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.committeeId) delete payload.committeeId;
      await api.post('/notices', payload);
      toast.success('Notice posted');
      setModalOpen(false);
      setForm({ title: '', body: '', committeeId: '' });
      fetchNotices();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post notice');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/notices/${confirmId}`);
      toast.success('Notice deleted');
      setNotices((prev) => prev.filter((n) => n._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete notice');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="skeleton-shimmer h-5 w-48 rounded mb-3" />
          <div className="skeleton-shimmer h-4 w-64 rounded mb-3" />
          <div className="skeleton-shimmer h-4 w-full rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Notices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Community announcements and updates</p>
        </div>
        {canPost && (
          <Button onClick={() => setModalOpen(true)}>+ New Notice</Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="space-y-4">
        {notices.map((n) => (
          <div key={n._id} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Posted by {n.postedBy?.name}
                  {n.committeeId && <span> · {n.committeeId.name}</span>}
                  <span> · {new Date(n.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              {canPost && n.postedBy?._id === user?.id && (
                <button onClick={() => { setConfirmId(n._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors shrink-0">Delete</button>
              )}
            </div>
            <p className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{n.body}</p>
          </div>
        ))}
        {notices.length === 0 && !loading && (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">No notices yet</p>
          </div>
        )}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Notice" message="Delete this notice?" confirmText="Delete" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post Notice">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Body</label>
            <textarea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          {user?.type === ROLES.APARTMENT_ADMIN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Scope</label>
              <select value={form.committeeId} onChange={(e) => setForm({ ...form, committeeId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                <option value="">Apartment-wide</option>
                {committees.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Post</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
