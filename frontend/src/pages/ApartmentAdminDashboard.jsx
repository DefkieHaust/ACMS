import { useState, useEffect } from 'react';
import api from '../api/client';

export default function ApartmentAdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/apartment-admin').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  const stats = [
    { label: 'Units', value: data.totalUnits, sub: `${data.occupiedUnits} occupied (${data.vacancyRate}% vacant)` },
    { label: 'Residents', value: data.totalResidents },
    { label: 'Committees', value: data.totalCommittees },
    { label: 'Complaints', value: data.totalComplaints, sub: `${data.openComplaints} open` },
    { label: 'Total Bills', value: `$${data.totalBills?.toLocaleString() || 0}`, sub: `$${data.unpaidBills?.toLocaleString() || 0} unpaid` },
    { label: 'Collected', value: `$${data.paidBills?.toLocaleString() || 0}` },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Apartment Dashboard</h1>
      {data.apartment && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900 capitalize">{data.apartment.name}</p>
            <p className="text-sm text-gray-500">{data.apartment.address} · Plan: {data.apartment.planId?.name || 'None'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Committees</h2>
          <div className="space-y-3">
            {data.committees?.map((c) => (
              <div key={c._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">Head: {c.headUserId?.name || 'Not assigned'}</p>
                </div>
              </div>
            ))}
            {(!data.committees || data.committees.length === 0) && <p className="text-sm text-gray-500">No committees yet</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Complaints</h2>
          <div className="space-y-3">
            {data.recentComplaints?.map((c) => (
              <div key={c._id} className="flex items-center justify-between">
                <div className="truncate">
                  <p className="font-medium text-gray-900 truncate">{c.description}</p>
                  <p className="text-sm text-gray-500">{c.raisedByUnitId?.unitNumber} · {c.committeeId?.name}</p>
                </div>
                <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
              </div>
            ))}
            {(!data.recentComplaints || data.recentComplaints.length === 0) && <p className="text-sm text-gray-500">No complaints</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
