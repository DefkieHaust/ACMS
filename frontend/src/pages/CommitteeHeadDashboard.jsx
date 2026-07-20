import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import { ROLES, BILL_STATUS } from '../utils/constants';

export default function CommitteeHeadDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/committee-head').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  const isMember = user?.type === ROLES.COMMITTEE_MEMBER;

  const stats = isMember ? [
    { label: 'Committee', value: data.committee?.name || '-' },
    { label: 'Open Complaints', value: data.openComplaints },
  ] : [
    { label: 'Members', value: data.members },
    { label: 'Income', value: `${data.currency || '$'}{data.totalIncome?.toLocaleString() || 0}` },
    { label: 'Expenses', value: `${data.currency || '$'}{data.totalExpense?.toLocaleString() || 0}` },
    { label: 'Balance', value: `${data.currency || '$'}{data.balance?.toLocaleString() || 0}` },
    { label: 'Complaints', value: data.totalComplaints, sub: `${data.openComplaints} open` },
    { label: 'Bills', value: `${data.currency || '$'}{data.totalBills?.toLocaleString() || 0}`, sub: `${data.currency || '$'}{data.unpaidBills?.toLocaleString() || 0} unpaid` },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {data.committee?.name || 'Committee'} Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {!isMember && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Ledger</h2>
            <div className="space-y-3">
              {data.recentLedger?.map((e) => (
                <div key={e._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{e.description}</p>
                    <p className="text-xs text-gray-500">{e.recordedBy?.name} · {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-medium ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {e.type === 'income' ? '+' : '-'}{data.currency || '$'}{e.amount}
                  </span>
                </div>
              ))}
              {(!data.recentLedger || data.recentLedger.length === 0) && <p className="text-sm text-gray-500">No ledger entries</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Complaints</h2>
            <div className="space-y-3">
              {data.recentComplaints?.map((c) => (
                <div key={c._id} className="flex items-center justify-between">
                  <div className="truncate">
                    <p className="font-medium text-gray-900 truncate">{c.description}</p>
                    <p className="text-xs text-gray-500">Unit {c.raisedByUnitId?.unitNumber}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                </div>
              ))}
              {(!data.recentComplaints || data.recentComplaints.length === 0) && <p className="text-sm text-gray-500">No complaints</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
