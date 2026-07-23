import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function CommitteesPage() {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [headModalOpen, setHeadModalOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [headForm, setHeadForm] = useState({ name: '', identifier: '', password: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const fetchCommittees = () => {
    setLoading(true);
    setError(null);
    api.get('/apartment/committees')
      .then((r) => setCommittees(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load committees');
        toast.error('Failed to load committees');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCommittees(); }, []);

  const createCommittee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/apartment/committees', form);
      toast.success('Committee created');
      setModalOpen(false);
      setForm({ name: '' });
      fetchCommittees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create committee');
    }
  };

  const openEdit = (c) => {
    setEditItem(c);
    setEditForm({ name: c.name, description: c.description || '' });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/apartment/committees/${editItem._id}`, editForm);
      toast.success('Committee updated');
      setEditOpen(false);
      fetchCommittees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update committee');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/apartment/committees/${confirmId}`);
      toast.success('Committee deleted');
      setConfirmOpen(false);
      setConfirmId(null);
      fetchCommittees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete committee');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const openHeadModal = (committee) => {
    setSelectedCommittee(committee);
    setHeadForm({ name: '', identifier: '', password: '' });
    setHeadModalOpen(true);
  };

  const createHead = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/apartment/committees/${selectedCommittee._id}/head`, headForm);
      toast.success('Committee head created');
      setHeadModalOpen(false);
      fetchCommittees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create head');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Committees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage committees and assign heads</p>
        </div>
        <Button onClick={() => { setForm({ name: '', description: '' }); setModalOpen(true); }}>+ New Committee</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={fetchCommittees} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {committees.map((c) => (
          <div key={c._id} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 hover:shadow-md transition-all duration-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{c.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Head: {c.headUserId?.name || 'Not assigned'}</p>
            {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{c.description}</p>}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { setViewItem(c); setViewOpen(true); }} className="text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">View</button>
              <button onClick={() => openEdit(c)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Edit</button>
              <button onClick={() => { setConfirmId(c._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
              {!c.headUserId && (
                <button onClick={() => openHeadModal(c)} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 transition-colors">Set Head</button>
              )}
            </div>
          </div>
        ))}
        {committees.length === 0 && (
          <div className="col-span-full text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No committees yet. Create your first committee.</p>
          </div>
        )}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Committee" message="Delete this committee permanently?" confirmText="Delete" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Committee">
        <form onSubmit={createCommittee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Committee Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maintenance Committee" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Oversees maintenance and repairs" rows="2" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Committee: ${editItem?.name}`}>
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Committee Name</label>
            <input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows="2" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={headModalOpen} onClose={() => setHeadModalOpen(false)} title={`Assign Head: ${selectedCommittee?.name}`}>
        <form onSubmit={createHead} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input type="text" required value={headForm.name} onChange={(e) => setHeadForm({ ...headForm, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Username / Staff ID</label>
            <input type="text" required value={headForm.identifier} onChange={(e) => setHeadForm({ ...headForm, identifier: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <input type="password" required value={headForm.password} onChange={(e) => setHeadForm({ ...headForm, password: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Create</Button>
            <Button type="button" variant="secondary" onClick={() => setHeadModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={viewItem?.name || 'Committee Details'}>
        {viewItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              {[['Name', viewItem.name], ['Status', viewItem.status || 'active'], ['Head', viewItem.headUserId?.name || 'Not assigned'], ['Description', viewItem.description || '-']].map(([label, value]) => (
                <div key={label} className={label === 'Description' ? 'col-span-2' : ''}>
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                  <span className="block mt-1 text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setViewOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
