import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const isResident = user?.type === ROLES.RESIDENT;
  const isAdmin = user?.type === ROLES.APARTMENT_ADMIN;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' });
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rating, setRating] = useState(0);

  const fetchRequests = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/service-requests?${params.toString()}`)
      .then((r) => setRequests(r.data))
      .catch((e) => { setError(e.response?.data?.error || 'Failed to load service requests'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/service-requests', form);
      toast.success('Service request submitted');
      setModalOpen(false);
      setForm({ title: '', description: '', category: 'other', priority: 'medium' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request');
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await api.put(`/service-requests/${id}`, updates);
      toast.success('Request updated');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleRate = async () => {
    if (!rating) return;
    try {
      await api.put(`/service-requests/${selectedRequest._id}/rate`, { rating });
      toast.success('Thank you for your rating');
      setRateModalOpen(false);
      setSelectedRequest(null);
      setRating(0);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rate');
    }
  };

  const canRate = (req) => isResident && req.status === 'completed' && !req.rating && req.residentUserId?._id === user?.userId;

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {isResident && (
            <Button onClick={() => setModalOpen(true)}>Submit Request</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchRequests} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>}
              {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Resident</th>}
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  {r.description && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{r.description}</p>}
                </td>
                {isAdmin && <td className="px-6 py-4 text-sm text-gray-600">{r.unitId?.unitNumber || '-'}</td>}
                {isAdmin && <td className="px-6 py-4 text-sm text-gray-600">{r.residentUserId?.name || '-'}</td>}
                <td className="px-6 py-4 text-sm text-gray-600">{r.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[r.priority] || 'bg-gray-100 text-gray-700'}`}>{r.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge status={r.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {isAdmin && r.status === 'open' && (
                      <button onClick={() => handleUpdate(r._id, { status: 'in_progress' })} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Accept</button>
                    )}
                    {isAdmin && r.status === 'in_progress' && (
                      <button onClick={() => handleUpdate(r._id, { status: 'completed' })} className="text-sm text-green-600 hover:text-green-800 font-medium">Complete</button>
                    )}
                    {canRate(r) && (
                      <button onClick={() => { setSelectedRequest(r); setRating(0); setRateModalOpen(true); }} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Rate</button>
                    )}
                    {isAdmin && r.status !== 'cancelled' && r.status !== 'completed' && (
                      <button onClick={() => handleUpdate(r._id, { status: 'cancelled' })} className="text-sm text-red-600 hover:text-red-800 font-medium">Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <p className="text-center text-gray-500 py-8">No service requests found</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit Service Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="cleaning">Cleaning</option>
                <option value="pest_control">Pest Control</option>
                <option value="security">Security</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Submit</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={rateModalOpen} onClose={() => { setRateModalOpen(false); setRating(0); }} title="Rate Service">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">How satisfied are you with the service?</p>
          <div className="flex gap-2 justify-center py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className={`w-10 h-10 rounded-full text-lg font-bold transition-colors ${star <= rating ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {star}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleRate} disabled={!rating} className="flex-1">Submit Rating</Button>
            <Button variant="secondary" onClick={() => { setRateModalOpen(false); setRating(0); }} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
