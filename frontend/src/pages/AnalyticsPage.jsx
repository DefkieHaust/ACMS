import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import api from '../api/client';
import Card from '../components/Card';
import Badge from '../components/Badge';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
};

function StatCard({ label, value, sub }) {
  return (
    <Card stat className="text-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/revenue-trend'),
    ]).then(([overview, trendRes]) => {
      setData(overview.data);
      setTrend(trendRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse p-8 space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div className="h-24 bg-gray-200 rounded-xl" /><div className="h-24 bg-gray-200 rounded-xl" /><div className="h-24 bg-gray-200 rounded-xl" /><div className="h-24 bg-gray-200 rounded-xl" /></div></div>;
  if (!data) return <div className="p-8 text-gray-500">Failed to load analytics</div>;

  const complaintLabels = Object.keys(data.complaints);
  const complaintValues = Object.values(data.complaints);
  const billLabels = Object.keys(data.bills);
  const billAmounts = billLabels.map(k => data.bills[k]?.total || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Apartments" value={data.apartments.total} sub={`${data.apartments.active} active`} />
        <StatCard label="Units" value={data.units.total} sub={`${data.units.occupied} occupied`} />
        <StatCard label="Revenue" value={`$${data.revenue.total.toLocaleString()}`} sub={`$${data.revenue.paid.toLocaleString()} collected`} />
        <StatCard label="Visitors" value={data.visitors.total} sub={`${data.visitors.checkedIn} checked in`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Status</h3>
          <div className="h-64">
            <Doughnut data={{
              labels: complaintLabels,
              datasets: [{ data: complaintValues, backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'] }],
            }} options={chartOptions} />
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Status</h3>
          <div className="h-64">
            <Bar data={{
              labels: billLabels,
              datasets: [{ label: 'Amount', data: billAmounts, backgroundColor: ['#F59E0B', '#10B981', '#EF4444'] }],
            }} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
          </div>
        </Card>
      </div>

      {trend.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (12 Months)</h3>
          <div className="h-72">
            <Line data={{
              labels: trend.map(t => t._id),
              datasets: [
                { label: 'Total', data: trend.map(t => t.total), borderColor: '#4F46E5', tension: 0.3 },
                { label: 'Paid', data: trend.map(t => t.paid), borderColor: '#10B981', tension: 0.3 },
              ],
            }} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card stat>
          <p className="text-sm text-gray-500">Service Requests</p>
          <div className="mt-2 space-y-1">
            {Object.entries(data.serviceRequests).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between"><span><Badge status={k} /></span><span className="font-semibold">{v}</span></div>
            ))}
            {Object.keys(data.serviceRequests).length === 0 && <p className="text-xs text-gray-400">No data</p>}
          </div>
        </Card>
        <Card stat>
          <p className="text-sm text-gray-500">Bookings</p>
          <div className="mt-2 space-y-1">
            {Object.entries(data.bookings).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between"><span><Badge status={k} /></span><span className="font-semibold">{v}</span></div>
            ))}
            {Object.keys(data.bookings).length === 0 && <p className="text-xs text-gray-400">No data</p>}
          </div>
        </Card>
        <Card stat>
          <p className="text-sm text-gray-500">Ledger</p>
          <div className="mt-2 space-y-1">
            {Object.entries(data.ledger).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between"><span className="text-sm font-medium capitalize">{k}</span><span className="font-semibold">${v.toLocaleString()}</span></div>
            ))}
            {Object.keys(data.ledger).length === 0 && <p className="text-xs text-gray-400">No data</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
