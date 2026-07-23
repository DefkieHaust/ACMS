import { useState, useEffect } from 'react';
import api from '../api/client';
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

  if (loading && logs.length === 0) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <div className="p-6 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all system activity and changes</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Resource</label>
            <select value={resourceFilter} onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">All</option>
              {resources.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Action</label>
            <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">All</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search path</label>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by API path..." className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchLogs} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Path</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No audit logs found</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{log.userId?.name || 'System'}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1">({log.userId?.type || '-'})</span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${log.action === 'create' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : log.action === 'update' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : log.action === 'delete' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{log.resource}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs max-w-xs truncate">{log.details?.path}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${log.details?.statusCode < 300 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : log.details?.statusCode < 500 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{log.details?.statusCode}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
