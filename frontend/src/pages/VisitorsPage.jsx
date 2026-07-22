import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

function QRCodeModal({ open, onClose, qrCode, visitorName }) {
  const qrUrl = `${window.location.origin}/api/visitors/verify/${qrCode}`;

  return (
    <Modal open={open} onClose={onClose} title="Visitor QR Code">
      <div className="space-y-4 text-center">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 inline-block mx-auto">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
            alt="QR Code"
            className="w-48 h-48 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{visitorName}</p>
          <p className="text-xs text-gray-500 mt-1 break-all">{qrUrl}</p>
        </div>
        <p className="text-xs text-gray-400">Visitor can show this QR code at the gate for check-in.</p>
        <button
          onClick={() => { navigator.clipboard?.writeText(qrUrl); toast.success('URL copied'); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          Copy URL
        </button>
      </div>
    </Modal>
  );
}

export default function VisitorsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [preApproveModalOpen, setPreApproveModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ visitorName: '', purpose: '', unitVisited: '' });
  const [preApproveForm, setPreApproveForm] = useState({ visitorName: '', purpose: 'Pre-approved visit', unitVisited: '', phone: '' });

  const fetchLogs = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/visitors?${params.toString()}`)
      .then((r) => setLogs(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load visitor logs');
        toast.error('Failed to load visitor logs');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', form);
      toast.success('Visitor logged');
      setModalOpen(false);
      setForm({ visitorName: '', purpose: '', unitVisited: '' });
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log visitor');
    }
  };

  const handlePreApprove = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/visitors/pre-approve', preApproveForm);
      toast.success('Visitor pre-approved');
      setPreApproveModalOpen(false);
      setPreApproveForm({ visitorName: '', purpose: 'Pre-approved visit', unitVisited: '', phone: '' });
      setQrCodeData({ qrCode: r.data.qrCode, visitorName: r.data.visitorName });
      setQrModalOpen(true);
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to pre-approve');
    }
  };

  const checkout = async (id) => {
    try {
      await api.put(`/visitors/${id}/checkout`);
      toast.success('Visitor checked out');
      fetchLogs();
    } catch (err) {
      toast.error('Failed to checkout');
    }
  };

  const showQR = (log) => {
    setQrCodeData({ qrCode: log.qrCode, visitorName: log.visitorName });
    setQrModalOpen(true);
  };

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Log</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All</option>
            <option value="checked_in">Checked In</option>
            <option value="pre_approved">Pre-approved</option>
          </select>
          <button onClick={() => setPreApproveModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Pre-approve</button>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Log Visitor</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchLogs} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Visitor</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Purpose</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{l.visitorName}</td>
                <td className="px-6 py-4 text-gray-600">{l.phone || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{l.purpose}</td>
                <td className="px-6 py-4 text-gray-600">{l.unitVisited}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(l.checkIn).toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-600">{l.checkOut ? new Date(l.checkOut).toLocaleString() : '-'}</td>
                <td className="px-6 py-4">
                  {l.preApproved && !l.checkOut ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Pre-approved</span>
                  ) : l.checkIn && !l.checkOut ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Active</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">Completed</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    {l.preApproved && l.qrCode && (
                      <button onClick={() => showQR(l)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">QR</button>
                    )}
                    {(!l.checkOut && !l.preApproved) && (
                      <button onClick={() => checkout(l._id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Check Out</button>
                    )}
                    {l.preApproved && !l.checkOut && (
                      <button onClick={() => checkout(l._id)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Check Out</button>
                    )}
                  </div>
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

      <Modal open={preApproveModalOpen} onClose={() => setPreApproveModalOpen(false)} title="Pre-approve Visitor">
        <form onSubmit={handlePreApprove} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name</label>
            <input type="text" required value={preApproveForm.visitorName} onChange={(e) => setPreApproveForm({ ...preApproveForm, visitorName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input type="text" value={preApproveForm.phone} onChange={(e) => setPreApproveForm({ ...preApproveForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input type="text" value={preApproveForm.purpose} onChange={(e) => setPreApproveForm({ ...preApproveForm, purpose: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Visited</label>
            <input type="text" required value={preApproveForm.unitVisited} onChange={(e) => setPreApproveForm({ ...preApproveForm, unitVisited: e.target.value })} placeholder="e.g. A-101" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Pre-approve</button>
            <button type="button" onClick={() => setPreApproveModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>

      {qrCodeData && (
        <QRCodeModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          qrCode={qrCodeData.qrCode}
          visitorName={qrCodeData.visitorName}
        />
      )}
    </div>
  );
}
