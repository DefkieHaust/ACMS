import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function NoticesPage() {
  const { user } = useAuth();
  const canPost = user?.type === ROLES.APARTMENT_ADMIN || user?.type === ROLES.COMMITTEE_HEAD;
  const [notices, setNotices] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', committeeId: '' });

  useEffect(() => {
    api.get('/notices').then((r) => setNotices(r.data));
    if (user?.type === ROLES.APARTMENT_ADMIN) {
      api.get('/apartment/committees').then((r) => setCommittees(r.data));
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
      const r = await api.get('/notices');
      setNotices(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post notice');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      toast.success('Notice deleted');
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete notice');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
        {canPost && (
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ New Notice</button>
        )}
      </div>

      <div className="space-y-4">
        {notices.map((n) => (
          <div key={n._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Posted by {n.postedBy?.name}
                  {n.committeeId && <span> · {n.committeeId.name}</span>}
                  <span> · {new Date(n.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              {canPost && n.postedBy?._id === user?.id && (
                <button onClick={() => handleDelete(n._id)} className="text-sm text-red-600 hover:text-red-800 font-medium shrink-0">Delete</button>
              )}
            </div>
            <p className="mt-3 text-gray-700 whitespace-pre-wrap">{n.body}</p>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="text-center py-12 text-gray-500">No notices yet</div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Post Notice">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea required rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          {user?.type === ROLES.APARTMENT_ADMIN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
              <select value={form.committeeId} onChange={(e) => setForm({ ...form, committeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Apartment-wide</option>
                {committees.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Post</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
