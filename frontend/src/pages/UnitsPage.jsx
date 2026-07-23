import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';
import { UNIT_TYPES } from '../utils/constants';
import Button from '../components/Button';

const statusBadgeColors = {
  occupied: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  vacant: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const borderColors = {
  occupied: 'border-green-200 dark:border-green-900',
  vacant: 'border-gray-100 dark:border-gray-800',
  maintenance: 'border-yellow-200 dark:border-yellow-900',
};

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ unitNumber: '', status: 'vacant', unitType: 'apartment', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/apartment/units')
      .then((r) => setUnits(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load units');
        toast.error('Failed to load units');
      });
    api.get('/apartment/residents')
      .then((r) => setOwners(r.data.filter((res) => res.residentType === 'owner' || !res.residentType)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ unitNumber: '', status: 'vacant', unitType: 'apartment', ownerId: '' });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditItem(u);
    setForm({ unitNumber: u.unitNumber, status: u.status, unitType: u.unitType || 'apartment', ownerId: u.ownerId?._id || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.ownerId) delete payload.ownerId;
    try {
      if (editItem) {
        await api.put(`/apartment/units/${editItem._id}`, payload);
        toast.success('Unit updated');
      } else {
        await api.post('/apartment/units', payload);
        toast.success('Unit created');
      }
      setModalOpen(false);
      const r = await api.get('/apartment/units');
      setUnits(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/apartment/units/${confirmId}`);
      toast.success('Unit deleted');
      setUnits(units.filter((u) => u._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (err) {
      toast.error('Failed to delete unit');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
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
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Units</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage units and track occupancy status</p>
        </div>
        <Button onClick={openCreate}>+ Add Unit</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline">Retry</button>
        </div>
      )}

      {units.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No units yet. Create your first unit.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {units.map((u) => (
            <div key={u._id} className={`rounded-2xl bg-white dark:bg-gray-900 border-2 shadow-sm p-6 hover:shadow-md transition-all duration-200 ${borderColors[u.status] || borderColors.vacant}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{u.unitNumber}</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.unitType || 'apartment'}</span>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadgeColors[u.status] || statusBadgeColors.vacant}`}>
                  {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Vacant'}
                </span>
              </div>
              {u.residentUserId && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Resident: {u.residentUserId.name}</p>
              )}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => openEdit(u)} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors">Edit</button>
                <button onClick={() => { setConfirmId(u._id); setConfirmOpen(true); }} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Unit" message="Delete this unit?" confirmText="Delete" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Unit' : 'Add Unit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit Number</label>
            <input type="text" required value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. A-101" className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit Type</label>
            <select value={form.unitType} onChange={(e) => setForm({ ...form, unitType: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              {UNIT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Owner</label>
            <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
              <option value="">No owner</option>
              {owners.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
