import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ResidentDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/resident').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>

      {data.unit ? (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <p className="text-sm text-gray-500">Unit</p>
            <p className="text-2xl font-bold text-gray-900">{data.unit.unitNumber}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Due</p>
              <p className="text-2xl font-bold text-gray-900">{data.currency || '$'}{data.totalBills?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Unpaid</p>
              <p className="text-2xl font-bold text-red-600">{data.currency || '$'}{data.unpaidBills?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Open Complaints</p>
              <p className="text-2xl font-bold text-gray-900">{data.complaints?.filter((c) => c.status !== 'resolved').length || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bills</h2>
              <div className="space-y-3">
                {data.bills?.slice(0, 5).map((b) => (
                  <div key={b._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{b.committeeId?.name} - {data.currency || '$'}{b.amount}</p>
                      <p className="text-xs text-gray-500">{b.period} · Due {new Date(b.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${b.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                  </div>
                ))}
                {(!data.bills || data.bills.length === 0) && <p className="text-sm text-gray-500">No bills</p>}
              </div>
              <Link to="/bills" className="block mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium">View all bills →</Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h2>
              <div className="space-y-3">
                {data.notices?.map((n) => (
                  <div key={n._id}>
                    <p className="font-medium text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-500">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {(!data.notices || data.notices.length === 0) && <p className="text-sm text-gray-500">No notices</p>}
              </div>
              <Link to="/notices" className="block mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium">View all notices →</Link>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500">No unit assigned to your account. Contact your apartment admin.</p>
        </div>
      )}
    </div>
  );
}
