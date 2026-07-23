import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function ResidentDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/resident').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
      </div>
    </div>
  );

  const c = data.currency || '$';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your apartment at a glance</p>
      </div>

      {data.unit ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6" style={{ animationDelay: '0ms' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unit</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{data.unit.unitNumber}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{data.unit.status}</p>
            </div>

            <div className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6" style={{ animationDelay: '80ms' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-500 to-accent-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Due</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{c}{data.totalBills?.toLocaleString() || 0}</p>
            </div>

            <div className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6" style={{ animationDelay: '160ms' }}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Complaints</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5">{data.complaints?.filter((c) => c.status !== 'resolved').length || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Bills</h2>
              <div className="space-y-2">
                {data.bills?.slice(0, 5).map((b) => (
                  <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{b.committeeId?.name} - {c}{b.amount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{b.period} · Due {new Date(b.dueDate).toLocaleDateString()}</p>
                    </div>
                    <Badge status={b.status} />
                  </div>
                ))}
                {(!data.bills || data.bills.length === 0) && <p className="text-sm text-gray-500 dark:text-gray-400">No bills</p>}
              </div>
              <Link to="/bills" className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
                View all bills <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Notices</h2>
              <div className="space-y-2">
                {data.notices?.map((n) => (
                  <div key={n._id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {(!data.notices || data.notices.length === 0) && <p className="text-sm text-gray-500 dark:text-gray-400">No notices</p>}
              </div>
              <Link to="/notices" className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">
                View all notices <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
            </Card>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Unit Assigned</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No unit assigned to your account. Contact your apartment admin to get set up.</p>
        </div>
      )}
    </div>
  );
}
