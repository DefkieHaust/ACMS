import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import PaymentModal from '../components/PaymentModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
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

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isResident ? 'My Bills' : 'Maintenance Bills'}</h1>
        {!isResident && (
          <div className="flex gap-2">
            <select value={selectedCommittee} onChange={handleCommitteeChange} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {!isResident && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>}
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Committee</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  {isResident && <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase" colSpan={2}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bills.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50">
                {!isResident && <td className="px-6 py-4 text-gray-900 font-medium">{b.unitId?.unitNumber}</td>}
                <td className="px-6 py-4 text-gray-600">{b.period}</td>
                <td className="px-6 py-4 text-gray-600">{b.committeeId?.name || '-'}</td>
                <td className="px-6 py-4 font-medium text-gray-900">${b.amount}</td>
                <td className="px-6 py-4 text-gray-600">{new Date(b.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <Badge status={b.status} />
                </td>
                {isResident && (
                  <td className="px-6 py-4 text-right">
                    {b.status === 'unpaid' && (
                      <button onClick={() => payBill(b)} className="text-sm text-green-600 hover:text-green-800 font-medium">Pay Now</button>
                    )}
                  </td>
                )}
                {isResident && (
                  <td className="px-6 py-4 text-right">
                    {b.status === 'paid' && (
                      <Link to={`/receipt/${b._id}`} className="text-sm text-primary-600 hover:text-primary-800 font-medium">Receipt</Link>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p className="text-center text-gray-500 py-8">No bills found</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Bills">
        <form onSubmit={generateBills} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <input type="text" required value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="e.g. 2026-07" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <p className="text-sm text-gray-500">Bills will be generated for all occupied units in this committee.</p>
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
