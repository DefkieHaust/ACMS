import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isResident = user?.type === ROLES.RESIDENT;
  const isCommittee = user?.type === ROLES.COMMITTEE_HEAD || user?.type === ROLES.COMMITTEE_MEMBER;
  const [complaints, setComplaints] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ committeeId: '', title: '', description: '' });
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateComplaintId, setRateComplaintId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/complaints')
      .then((r) => setComplaints(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load complaints');
        toast.error('Failed to load complaints');
      });
    if (isResident) {
      api.get('/committees')
        .then((r) => setCommittees(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchComplaints = () => {
    setLoading(true);
    setError(null);
    api.get('/complaints')
      .then((r) => setComplaints(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load complaints');
        toast.error('Failed to load complaints');
      })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', form);
      toast.success('Complaint raised');
      setModalOpen(false);
      setForm({ committeeId: '', title: '', description: '' });
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to raise complaint');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/complaints/${id}`, { status });
      toast.success(`Complaint ${status}`);
      fetchComplaints();
    } catch (err) {
      toast.error('Failed to update complaint');
    }
  };

  const openRateModal = (id) => {
    setRateComplaintId(id);
    setRateModalOpen(true);
  };

  const submitRating = async (rating) => {
    try {
      await api.put(`/complaints/${rateComplaintId}/rate`, { rating });
      toast.success('Rating submitted');
      setRateModalOpen(false);
      setRateComplaintId(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rate');
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-40 skeleton-shimmer rounded-lg" />
      <div className="h-64 skeleton-shimmer rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Complaints</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track complaints</p>
        </div>
        {isResident && (
          <Button onClick={() => setModalOpen(true)}>+ Raise Complaint</Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchComplaints} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Committee</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {complaints.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">{c.title || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{c.description}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.raisedByUnitId?.unitNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.committeeId?.name}</td>
                <td className="px-6 py-4">
                  {isCommittee ? (
                    <select value={c.status} onChange={(e) => updateStatus(c._id, e.target.value)} className="text-xs border border-gray-300 dark:border-gray-600 rounded-xl px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  ) : (
                    <Badge status={c.status} />
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{c.rating ? '★'.repeat(c.rating) : '-'}</td>
                <td className="px-6 py-4 text-right">
                  {isResident && c.status === 'resolved' && !c.rating && (
                    <button onClick={() => openRateModal(c._id)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Rate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {complaints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No complaints found</p>
          </div>
        )}
      </div>

      <Modal open={rateModalOpen} onClose={() => setRateModalOpen(false)} title="Rate Complaint Resolution">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-6">How satisfied are you with the resolution?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => submitRating(star)}
                className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400 text-2xl transition-colors flex items-center justify-center"
                title={`${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          <button onClick={() => setRateModalOpen(false)} className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise a Complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Committee</label>
            <select required value={form.committeeId} onChange={(e) => setForm({ ...form, committeeId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">Select committee</option>
              {committees.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title for your complaint" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Submit</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
