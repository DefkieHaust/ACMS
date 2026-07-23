import { useState, useEffect } from 'react';
import api from '../api/client';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([]);
  const [actions, setActions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.get('/audit-logs/resources')
      .then((r) => { setResources(r.data.resources); setActions(r.data.actions); })
      .catch(() => {});
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (resourceFilter) params.set('resource', resourceFilter);
    if (actionFilter) params.set('action', actionFilter);
    if (search) params.set('search', search);
    params.set('page', String(page));
    api.get(`/audit-logs?${params.toString()}`)
      .then((r) => {
        setLogs(r.data);
        if (r.data.pagination) setTotalPages(r.data.pagination.totalPages);
      })
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load audit logs');
        toast.error('Failed to load audit logs');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [page, resourceFilter, actionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  if (loading && logs.length === 0) return <LoadingSkeleton lines={10} />;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Resource</label>
            <select value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All</option>
              {resources.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search path</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by API path..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchLogs} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Path</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50 text-sm">
                <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span className="font-medium text-gray-900">{log.userId?.name || 'System'}</span>
                  <span className="text-gray-400 ml-1">({log.userId?.type || '-'})</span>
                </td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${log.action === 'create' ? 'bg-green-100 text-green-700' : log.action === 'update' ? 'bg-blue-100 text-blue-700' : log.action === 'delete' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{log.action}</span>
                </td>
                <td className="px-6 py-3 text-gray-700">{log.resource}</td>
                <td className="px-6 py-3 text-gray-500 font-mono text-xs max-w-xs truncate">{log.details?.path}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${log.details?.statusCode < 300 ? 'bg-green-100 text-green-700' : log.details?.statusCode < 500 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{log.details?.statusCode}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="text-center text-gray-500 py-8">No audit logs found</p>}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
