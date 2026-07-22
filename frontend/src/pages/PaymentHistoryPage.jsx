import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

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

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isAdmin ? 'Payment History' : 'My Payment History'}</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchHistory} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>}
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
              {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Committee</th>}
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Paid On</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                {isAdmin && <td className="px-6 py-4 font-medium text-gray-900">{p.unitId?.unitNumber || '-'}</td>}
                <td className="px-6 py-4 text-gray-600">{p.period}</td>
                {isAdmin && <td className="px-6 py-4 text-gray-600">{p.committeeId?.name || '-'}</td>}
                <td className="px-6 py-4 font-medium text-gray-900">${p.amount?.toFixed(2)}</td>
                <td className="px-6 py-4 text-gray-600">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="text-center text-gray-500 py-8">No payment history found</p>}
      </div>
    </div>
  );
}
