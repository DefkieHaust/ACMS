import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import toast from 'react-hot-toast';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function BillsPage() {
  const { user } = useAuth();
  const isResident = user?.type === ROLES.RESIDENT;
  const [committees, setCommittees] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCommittee, setSelectedCommittee] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', period: '', dueDate: '' });
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState(null);

  useEffect(() => {
    if (!isResident) {
      api.get('/committees')
        .then((r) => setCommittees(r.data))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (isResident) {
      api.get('/dashboard/resident')
        .then((r) => setBills(r.data.bills || []))
        .catch((e) => {
          setError(e.response?.data?.error || 'Failed to load bills');
          toast.error('Failed to load bills');
        })
        .finally(() => setLoading(false));
    } else if (user?.committeeId) {
      api.get(`/committees/${user.committeeId}/bills`)
        .then((r) => setBills(r.data))
        .catch((e) => {
          setError(e.response?.data?.error || 'Failed to load bills');
          toast.error('Failed to load bills');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.committeeId]);

  const fetchBillsForCommittee = (committeeId) => {
    setLoading(true);
    setError(null);
    if (committeeId) {
      api.get(`/committees/${committeeId}/bills`)
        .then((r) => setBills(r.data))
        .catch((e) => {
          setError(e.response?.data?.error || 'Failed to load bills');
          toast.error('Failed to load bills');
        })
        .finally(() => setLoading(false));
    } else {
      setBills([]);
      setLoading(false);
    }
  };

  const handleCommitteeChange = (e) => {
    setSelectedCommittee(e.target.value);
    fetchBillsForCommittee(e.target.value);
  };

  const generateBills = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/committees/${selectedCommittee}/bills/generate`, { ...form, amount: Number(form.amount), dueDate: new Date(form.dueDate).toISOString() });
      toast.success('Bills generated');
      setModalOpen(false);
      fetchBillsForCommittee(selectedCommittee);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate bills');
    }
  };

  const payBill = (bill) => {
    setPayingBill(bill);
    setPayModalOpen(true);
  };

  const handlePaySuccess = async () => {
    const r = await api.get('/dashboard/resident');
    setBills(r.data.bills || []);
    setPayingBill(null);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{isResident ? 'My Bills' : 'Maintenance Bills'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage maintenance bills</p>
        </div>
        {!isResident && (
          <div className="flex gap-2">
            <select value={selectedCommittee} onChange={handleCommitteeChange} className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">Select committee</option>
              {committees.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {selectedCommittee && (
              <Button onClick={() => { setForm({ amount: '', period: '', dueDate: '' }); setModalOpen(true); }}>Generate Bills</Button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              {!isResident && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Committee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              {isResident && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" colSpan={2}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={isResident ? 7 : 6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No bills found</p>
                  </div>
                </td>
              </tr>
            ) : (
              bills.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  {!isResident && <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{b.unitId?.unitNumber}</td>}
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{b.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{b.committeeId?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${b.amount}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(b.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge status={b.status} />
                  </td>
                  {isResident && (
                    <td className="px-6 py-4 text-sm text-right">
                      {b.status === 'unpaid' && (
                        <button onClick={() => payBill(b)} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 transition-colors">Pay Now</button>
                      )}
                    </td>
                  )}
                  {isResident && (
                    <td className="px-6 py-4 text-sm text-right">
                      {b.status === 'paid' && (
                        <Link to={`/receipt/${b._id}`} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Receipt</Link>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Bills">
        <form onSubmit={generateBills} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount ($)</label>
            <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period</label>
            <input type="text" required value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. 2026-07" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due Date</label>
            <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bills will be generated for all occupied units in this committee.</p>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Generate</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      {payingBill && (
        <PaymentModal
          open={payModalOpen}
          onClose={() => { setPayModalOpen(false); setPayingBill(null); }}
          amount={payingBill.amount}
          currency={payingBill.currency || 'USD'}
          billId={payingBill._id}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}
