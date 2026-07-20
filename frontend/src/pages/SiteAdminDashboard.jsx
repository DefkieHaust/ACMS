import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function SiteAdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/site-admin').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  const stats = [
    { label: 'Total Apartments', value: data.totalApartments, sub: `${data.activeApartments} active` },
    { label: 'Plans', value: data.totalPlans },
    { label: 'Total Revenue', value: `$${data.totalRevenue.toLocaleString()}`, sub: `$${data.outstandingRevenue.toLocaleString()} outstanding` },
    { label: 'Invoices', value: data.totalInvoices, sub: `${data.unpaidInvoices} unpaid` },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Site Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Apartments</h2>
          <div className="space-y-3">
            {data.recentApartments.map((a) => (
              <div key={a._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.name}</p>
                  <p className="text-sm text-gray-500">{a.planId?.name || 'No plan'} {a.city ? `· ${a.city}` : ''} {a.apartmentType ? `· ${a.apartmentType.replace('_', ' ')}` : ''}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
              </div>
            ))}
          </div>
          <Link to="/admin/apartments" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all apartments →</Link>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {data.recentInvoices.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.apartmentId?.name}</p>
                  <p className="text-sm text-gray-500">{inv.period} · {(inv.currency || '$')}{inv.amount}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
              </div>
            ))}
          </div>
          <Link to="/invoices" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium">View all invoices →</Link>
        </div>
      </div>
    </div>
  );
}
