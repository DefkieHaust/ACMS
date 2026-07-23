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

  if (!data) return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Apartments', value: data.totalApartments, sub: `${data.activeApartments} active`, gradient: 'from-primary-500 to-primary-600' },
    { label: 'Plans', value: data.totalPlans, sub: null, gradient: 'from-accent-500 to-accent-600' },
    { label: 'Total Revenue', value: `$${data.totalRevenue.toLocaleString()}`, sub: `$${data.outstandingRevenue.toLocaleString()} outstanding`, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Invoices', value: data.totalInvoices, sub: `${data.unpaidInvoices} unpaid`, gradient: 'from-violet-500 to-violet-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 card-hover" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />
            <div className="p-6">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{s.value}</p>
              {s.sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Apartments</h2>
          <div className="space-y-2">
            {data.recentApartments.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{a.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{a.planId?.name || 'No plan'} {a.city ? `· ${a.city}` : ''}</p>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
          </div>
          <Link to="/admin/apartments" className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
            View all apartments
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Invoices</h2>
          <div className="space-y-2">
            {data.recentInvoices.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{inv.apartmentId?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{inv.period} · {(inv.currency || '$')}{inv.amount}</p>
                </div>
                <Badge status={inv.status} />
              </div>
            ))}
          </div>
          <Link to="/admin/invoices" className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
            View all invoices
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </Card>
      </div>
    </div>
  );
}
