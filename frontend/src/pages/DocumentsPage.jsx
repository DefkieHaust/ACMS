import { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/constants';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';

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

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All categories</option>
            <option value="general">General</option>
            <option value="bylaws">Bylaws</option>
            <option value="minutes">Minutes</option>
            <option value="financial">Financial</option>
            <option value="forms">Forms</option>
            <option value="other">Other</option>
          </select>
          <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium cursor-pointer">
            Upload
            <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchDocuments} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((d) => (
              <tr key={d._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">{d.originalName}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{d.category}</span></td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatSize(d.size)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{d.uploadedBy?.name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleDownload(d._id, d.originalName)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Download</button>
                    {isAdmin && <button onClick={() => handleDelete(d._id)} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>}
      </div>
    </div>
  );
}
