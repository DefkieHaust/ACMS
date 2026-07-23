import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { ROLES } from '../utils/constants';

export default function CommitteeHeadDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/committee-head').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton-shimmer rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-2xl" />)}
      </div>
    </div>
  );

  const isMember = user?.type === ROLES.COMMITTEE_MEMBER;
  const c = data.currency || '$';
  const fmt = (n) => n?.toLocaleString() || 0;

  const stats = isMember ? [
    { label: 'Committee', value: data.committee?.name || '-', gradient: 'from-primary-500 to-primary-600' },
    { label: 'Open Complaints', value: data.openComplaints, gradient: 'from-rose-500 to-rose-600' },
  ] : [
    { label: 'Members', value: data.members, gradient: 'from-primary-500 to-primary-600' },
    { label: 'Income', value: `${c}${fmt(data.totalIncome)}`, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Expenses', value: `${c}${fmt(data.totalExpense)}`, gradient: 'from-rose-500 to-rose-600' },
    { label: 'Balance', value: `${c}${fmt(data.balance)}`, gradient: 'from-accent-500 to-accent-600' },
    { label: 'Complaints', value: data.totalComplaints, sub: `${data.openComplaints} open`, gradient: 'from-violet-500 to-violet-600' },
    { label: 'Bills', value: `${c}${fmt(data.totalBills)}`, sub: `${c}${fmt(data.unpaidBills)} unpaid`, gradient: 'from-cyan-500 to-cyan-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          {data.committee?.name || 'Committee'} Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Committee overview</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200 card-hover" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
              {s.sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {!isMember && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Ledger</h2>
            <div className="space-y-2">
              {data.recentLedger?.map((e) => (
                <div key={e._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{e.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{e.recordedBy?.name} · {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-medium ${e.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {e.type === 'income' ? '+' : '-'}{c}{e.amount}
                  </span>
                </div>
              ))}
              {(!data.recentLedger || data.recentLedger.length === 0) && <p className="text-sm text-gray-500 dark:text-gray-400">No ledger entries</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Complaints</h2>
            <div className="space-y-2">
              {data.recentComplaints?.map((c) => (
                <div key={c._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="truncate flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{c.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unit {c.raisedByUnitId?.unitNumber}</p>
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
      )}
    </div>
  );
}
