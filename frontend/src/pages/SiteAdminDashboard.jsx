import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function SiteAdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/site-admin').then((r) => setData(r.data)).catch(() => setData(null));
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
          <Card key={s.label} stat>
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Apartments</h2>
          <div className="space-y-3">
            {data.recentApartments.map((a) => (
              <div key={a._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.name}</p>
                  <p className="text-sm text-gray-500">{a.planId?.name || 'No plan'} {a.city ? `· ${a.city}` : ''} {a.apartmentType ? `· ${a.apartmentType.replace('_', ' ')}` : ''}</p>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
          <Link to="/admin/apartments" className="block mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium">View all apartments →</Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {data.recentInvoices.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{inv.apartmentId?.name}</p>
                  <p className="text-sm text-gray-500">{inv.period} · {(inv.currency || '$')}{inv.amount}</p>
                </div>
                <Badge status={inv.status} />
              </div>
            ))}
          </div>
          <Link to="/admin/invoices" className="block mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium">View all invoices →</Link>
        </Card>
      </div>
    </div>
  );
}
