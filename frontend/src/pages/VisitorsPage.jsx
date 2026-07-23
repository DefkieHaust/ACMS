import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Button from '../components/Button';

function QRCodeModal({ open, onClose, qrCode, visitorName }) {
  const qrUrl = `${window.location.origin}/api/visitors/verify/${qrCode}`;

  return (
    <Modal open={open} onClose={onClose} title="Visitor QR Code">
      <div className="space-y-4 text-center">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 inline-block mx-auto">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
            alt="QR Code"
            className="w-48 h-48 mx-auto"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{visitorName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">{qrUrl}</p>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">Visitor can show this QR code at the gate for check-in.</p>
        <Button onClick={() => { navigator.clipboard?.writeText(qrUrl); toast.success('URL copied'); }}>
          Copy URL
        </Button>
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

  if (loading) return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Visitor Log</h1>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="h-4 skeleton-shimmer rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Visitor Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage visitor entries</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="">All</option>
            <option value="checked_in">Checked In</option>
            <option value="pre_approved">Pre-approved</option>
          </select>
          <Button onClick={() => setPreApproveModalOpen(true)} variant="primary" className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">Pre-approve</Button>
          <Button onClick={() => setModalOpen(true)}>+ Log Visitor</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchLogs} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visitor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purpose</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((l) => (
              <tr key={l._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{l.visitorName}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{l.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{l.purpose}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{l.unitVisited}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(l.checkIn).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{l.checkOut ? new Date(l.checkOut).toLocaleString() : '-'}</td>
                <td className="px-6 py-4 text-sm">
                  {l.preApproved && !l.checkOut ? (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pre-approved</span>
                  ) : l.checkIn && !l.checkOut ? (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Active</span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Completed</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <div className="flex gap-2 justify-end">
                    {l.preApproved && l.qrCode && (
                      <button onClick={() => showQR(l)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">QR</button>
                    )}
                    {(!l.checkOut && !l.preApproved) && (
                      <button onClick={() => checkout(l._id)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Check Out</button>
                    )}
                    {l.preApproved && !l.checkOut && (
                      <button onClick={() => checkout(l._id)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Check Out</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No visitor logs yet</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Visitor">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visitor Name</label>
            <input type="text" required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
            <input type="text" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Visited</label>
            <input type="text" required value={form.unitVisited} onChange={(e) => setForm({ ...form, unitVisited: e.target.value })} placeholder="e.g. A-101" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Log</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={preApproveModalOpen} onClose={() => setPreApproveModalOpen(false)} title="Pre-approve Visitor">
        <form onSubmit={handlePreApprove} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visitor Name</label>
            <input type="text" required value={preApproveForm.visitorName} onChange={(e) => setPreApproveForm({ ...preApproveForm, visitorName: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (optional)</label>
            <input type="text" value={preApproveForm.phone} onChange={(e) => setPreApproveForm({ ...preApproveForm, phone: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
            <input type="text" value={preApproveForm.purpose} onChange={(e) => setPreApproveForm({ ...preApproveForm, purpose: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Visited</label>
            <input type="text" required value={preApproveForm.unitVisited} onChange={(e) => setPreApproveForm({ ...preApproveForm, unitVisited: e.target.value })} placeholder="e.g. A-101" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">Pre-approve</Button>
            <Button type="button" variant="secondary" onClick={() => setPreApproveModalOpen(false)} className="flex-1">Cancel</Button>
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
