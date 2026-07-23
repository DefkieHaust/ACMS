import { useState, useEffect } from 'react';
import api from '../api/client';

export default function ApartmentAdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/apartment-admin').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
      </div>
    </div>
  );

  const stats = [
    { label: 'Units', value: data.totalUnits, sub: `${data.occupiedUnits} occupied (${data.vacancyRate}% vacant)`, gradient: 'from-primary-500 to-primary-600' },
    { label: 'Residents', value: data.totalResidents, sub: null, gradient: 'from-accent-500 to-accent-600' },
    { label: 'Committees', value: data.totalCommittees, sub: null, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Complaints', value: data.totalComplaints, sub: `${data.openComplaints} open`, gradient: 'from-rose-500 to-rose-600' },
    { label: 'Total Bills', value: `$${data.totalBills?.toLocaleString() || 0}`, sub: `$${data.unpaidBills?.toLocaleString() || 0} unpaid`, gradient: 'from-violet-500 to-violet-600' },
    { label: 'Collected', value: `$${data.paidBills?.toLocaleString() || 0}`, sub: null, gradient: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Apartment Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your apartment at a glance</p>
        </div>
        {data.apartment && (
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{data.apartment.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Committees</h2>
          <div className="space-y-2">
            {data.committees?.map((c) => (
              <div key={c._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Head: {c.headUserId?.name || 'Not assigned'}</p>
                </div>
              </div>
            ))}
            {(!data.committees || data.committees.length === 0) && <p className="text-sm text-gray-500 dark:text-gray-400">No committees yet</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Complaints</h2>
          <div className="space-y-2">
            {data.recentComplaints?.map((c) => (
              <div key={c._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="truncate flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{c.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{c.raisedByUnitId?.unitNumber} · {c.committeeId?.name}</p>
                </div>
                <span className={`shrink-0 ml-3 px-2.5 py-1 text-xs font-medium rounded-full ${
                  c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  c.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>{c.status}</span>
              </div>
            ))}
            {(!data.recentComplaints || data.recentComplaints.length === 0) && <p className="text-sm text-gray-500 dark:text-gray-400">No complaints</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
