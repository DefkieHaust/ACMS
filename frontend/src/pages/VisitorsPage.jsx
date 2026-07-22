import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

export default function VisitorsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ visitorName: '', purpose: '', unitVisited: '' });

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/visitors')
      .then((r) => setLogs(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load visitor logs');
        toast.error('Failed to load visitor logs');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', form);
      toast.success('Visitor logged');
      setModalOpen(false);
      setForm({ visitorName: '', purpose: '', unitVisited: '' });
      const r = await api.get('/visitors');
      setLogs(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log visitor');
    }
  };

  const checkout = async (id) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success('Visitor checked out');
      const r = await api.get('/visitors');
      setLogs(r.data);
    } catch (err) {
      toast.error('Failed to checkout');
    }
  };

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Log</h1>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Log Visitor</button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Visitor</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Logged By</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{l.visitorName}</td>
                <td className="px-6 py-4 text-gray-600">{l.purpose}</td>
                <td className="px-6 py-4 text-gray-600">{l.unitVisited}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(l.checkIn).toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-600">{l.checkOut ? new Date(l.checkOut).toLocaleString() : <span className="text-yellow-600 font-medium">Active</span>}</td>
                <td className="px-6 py-4 text-gray-600">{l.loggedBy?.name}</td>
                <td className="px-6 py-4 text-right">
                  {!l.checkOut && (
                    <button onClick={() => checkout(l._id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Check Out</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-gray-500 py-8">No visitor logs yet</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Visitor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
            <input type="text" required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input type="text" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Visited</label>
            <input type="text" required value={form.unitVisited} onChange={(e) => setForm({ ...form, unitVisited: e.target.value })} placeholder="e.g. A-101" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Log</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
