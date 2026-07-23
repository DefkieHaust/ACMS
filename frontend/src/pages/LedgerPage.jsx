import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function LedgerPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'income', amount: '', description: '' });

  const fetchEntries = () => {
    if (user?.committeeId) {
      setLoading(true);
      setError(null);
      api.get(`/committees/${user.committeeId}/ledger`)
        .then((r) => setEntries(r.data))
        .catch((e) => {
          setError(e.response?.data?.error || 'Failed to load ledger');
          toast.error('Failed to load ledger');
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchEntries(); }, [user?.committeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/committees/${user.committeeId}/ledger`, { ...form, amount: Number(form.amount) });
      toast.success('Entry added');
      setModalOpen(false);
      setForm({ type: 'income', amount: '', description: '' });
      fetchEntries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add entry');
    }
  };

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
        <div className="h-4 w-48 skeleton-shimmer rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 skeleton-shimmer rounded-2xl" />
        <div className="h-24 skeleton-shimmer rounded-2xl" />
        <div className="h-24 skeleton-shimmer rounded-2xl" />
      </div>
      <div className="h-64 skeleton-shimmer rounded-2xl" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Committee Ledger</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track committee income and expenses</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Add Entry</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchEntries} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Income</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+${totalIncome.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Expense</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">-${totalExpense.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
          <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            ${(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recorded By</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((e) => (
              <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{new Date(e.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${e.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{e.type}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{e.description}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{e.recordedBy?.name}</td>
                <td className={`px-6 py-4 text-sm text-right font-medium ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {e.type === 'income' ? '+' : '-'}${e.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">No data found</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Ledger Entry">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount ($)</label>
            <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <input type="text" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Add</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
