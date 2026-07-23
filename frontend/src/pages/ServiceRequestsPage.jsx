import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="h-4 skeleton-shimmer rounded flex-1" />
            <div className="h-4 skeleton-shimmer rounded w-24" />
            <div className="h-4 skeleton-shimmer rounded w-20" />
            <div className="h-4 skeleton-shimmer rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Service Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track maintenance requests</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
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
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchRequests} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
              {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>}
              {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resident</th>}
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {requests.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                  {r.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-xs">{r.description}</p>}
                </td>
                {isAdmin && <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.unitId?.unitNumber || '-'}</td>}
                {isAdmin && <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.residentUserId?.name || '-'}</td>}
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{r.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[r.priority] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>{r.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge status={r.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {isAdmin && r.status === 'open' && (
                      <button onClick={() => handleUpdate(r._id, { status: 'in_progress' })} className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">Accept</button>
                    )}
                    {isAdmin && r.status === 'in_progress' && (
                      <button onClick={() => handleUpdate(r._id, { status: 'completed' })} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 transition-colors">Complete</button>
                    )}
                    {canRate(r) && (
                      <button onClick={() => { setSelectedRequest(r); setRating(0); setRateModalOpen(true); }} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Rate</button>
                    )}
                    {isAdmin && r.status !== 'cancelled' && r.status !== 'completed' && (
                      <button onClick={() => handleUpdate(r._id, { status: 'cancelled' })} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-lg mb-1">No service requests found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Submit a new request to get started</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Submit Service Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
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
          <p className="text-sm text-gray-600 dark:text-gray-400">How satisfied are you with the service?</p>
          <div className="flex gap-2 justify-center py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className={`w-10 h-10 rounded-full text-lg font-bold transition-colors ${star <= rating ? 'bg-yellow-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
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
