import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
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

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        {isResident && (
          <Button onClick={() => setModalOpen(true)}>+ Raise Complaint</Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchComplaints} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Committee</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {complaints.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-gray-900 font-medium max-w-xs truncate">{c.title || '-'}</td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{c.description}</td>
                <td className="px-6 py-4 text-gray-600">{c.raisedByUnitId?.unitNumber}</td>
                <td className="px-6 py-4 text-gray-600">{c.committeeId?.name}</td>
                <td className="px-6 py-4">
                  {isCommittee ? (
                    <select value={c.status} onChange={(e) => updateStatus(c._id, e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2 py-1">
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  ) : (
                    <Badge status={c.status} />
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.rating ? '★'.repeat(c.rating) : '-'}</td>
                <td className="px-6 py-4 text-right">
                  {isResident && c.status === 'resolved' && !c.rating && (
                    <button onClick={() => openRateModal(c._id)} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Rate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {complaints.length === 0 && <p className="text-center text-gray-500 py-8">No complaints found</p>}
      </div>

      <Modal open={rateModalOpen} onClose={() => setRateModalOpen(false)} title="Rate Complaint Resolution">
        <div className="text-center">
          <p className="text-gray-600 mb-6">How satisfied are you with the resolution?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => submitRating(star)}
                className="w-12 h-12 rounded-lg bg-gray-100 hover:bg-yellow-100 hover:text-yellow-600 text-2xl transition-colors flex items-center justify-center"
                title={`${star} star${star > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
          <button onClick={() => setRateModalOpen(false)} className="mt-6 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise a Complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
            <select required value={form.committeeId} onChange={(e) => setForm({ ...form, committeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select committee</option>
              {committees.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title for your complaint" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
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
