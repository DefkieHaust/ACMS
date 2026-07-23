import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function DocumentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.type === ROLES.APARTMENT_ADMIN;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('');
  const fileRef = useRef(null);

  const fetchDocuments = () => {
    setLoading(true);
    setError(null);
    const params = category ? `?category=${category}` : '';
    api.get(`/documents${params}`)
      .then((r) => setDocuments(r.data))
      .catch((e) => { setError(e.response?.data?.error || 'Failed to load documents'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocuments(); }, [category]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category || 'general');
    try {
      await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Document uploaded');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    e.target.value = '';
  };

  const handleDownload = async (id, originalName) => {
    try {
      const r = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 skeleton-shimmer rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage apartment documents and files</p>
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
            <option value="">All categories</option>
            <option value="general">General</option>
            <option value="bylaws">Bylaws</option>
            <option value="minutes">Minutes</option>
            <option value="financial">Financial</option>
            <option value="forms">Forms</option>
            <option value="other">Other</option>
          </select>
          <Button onClick={() => fileRef.current?.click()}>Upload</Button>
          <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchDocuments} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet</p>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{d.originalName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm"><span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">{d.category}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{formatSize(d.size)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{d.uploadedBy?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleDownload(d._id, d.originalName)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Download</button>
                      {isAdmin && <button onClick={() => handleDelete(d._id)} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
