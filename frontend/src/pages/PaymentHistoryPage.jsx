import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';
import Badge from '../components/Badge';

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.type === ROLES.APARTMENT_ADMIN;
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = () => {
    setLoading(true);
    setError(null);
    if (isAdmin) {
      api.get('/apartment/payment-history')
        .then((r) => setPayments(r.data))
        .catch((e) => { setError(e.response?.data?.error || 'Failed to load payment history'); })
        .finally(() => setLoading(false));
    } else {
      api.get('/dashboard/resident')
        .then((r) => {
          const bills = r.data.bills || [];
          setPayments(bills.filter((b) => b.status === 'paid'));
        })
        .catch((e) => { setError(e.response?.data?.error || 'Failed to load payment history'); })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{isAdmin ? 'Payment History' : 'My Payment History'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View all recorded payments</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchHistory} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
              {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Committee</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paid On</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No payment history found</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  {isAdmin && <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{p.unitId?.unitNumber || '-'}</td>}
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{p.period}</td>
                  {isAdmin && <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{p.committeeId?.name || '-'}</td>}
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">${p.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge status={p.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
