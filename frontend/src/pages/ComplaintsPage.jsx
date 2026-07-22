import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isResident = user?.type === ROLES.RESIDENT;
  const isCommittee = user?.type === ROLES.COMMITTEE_HEAD || user?.type === ROLES.COMMITTEE_MEMBER;
  const [complaints, setComplaints] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ committeeId: '', title: '', description: '' });

  useEffect(() => {
    fetchComplaints();
    if (isResident) {
      api.get('/committees').then((r) => setCommittees(r.data));
    }
  }, []);

  const fetchComplaints = () => {
    api.get('/complaints').then((r) => setComplaints(r.data));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', form);
      toast.success('Complaint raised');
      setModalOpen(false);
      setForm({ committeeId: '', description: '' });
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

  const rateComplaint = async (id) => {
    const rating = prompt('Rate (1-5):');
    if (!rating || rating < 1 || rating > 5) return toast.error('Rating must be 1-5');
    try {
      await api.put(`/complaints/${id}/rate`, { rating: Number(rating) });
      toast.success('Rating submitted');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rate');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        {isResident && (
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Raise Complaint</button>
        )}
      </div>

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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">{c.rating ? '★'.repeat(c.rating) : '-'}</td>
                <td className="px-6 py-4 text-right">
                  {isResident && c.status === 'resolved' && !c.rating && (
                    <button onClick={() => rateComplaint(c._id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Rate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {complaints.length === 0 && <p className="text-center text-gray-500 py-8">No complaints found</p>}
      </div>

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
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Submit</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
