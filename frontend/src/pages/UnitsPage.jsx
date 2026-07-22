import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import PageLoading from '../components/PageLoading';
import toast from 'react-hot-toast';
import { UNIT_TYPES } from '../utils/constants';

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

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Units</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">+ Add Unit</button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map((u) => (
          <div key={u._id} className={`bg-white rounded-xl p-5 shadow-sm border-2 ${u.status === 'occupied' ? 'border-green-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{u.unitNumber}</h3>
                <span className="text-xs text-gray-500 capitalize">{u.unitType || 'apartment'}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{u.status}</span>
            </div>
            {u.residentUserId && (
              <p className="text-sm text-gray-600">Resident: {u.residentUserId.name}</p>
            )}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => openEdit(u)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
              <button onClick={() => { setConfirmId(u._id); setConfirmOpen(true); }} className="text-sm text-red-600 hover:text-red-800 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Unit" message="Delete this unit?" confirmText="Delete" danger />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Unit' : 'Add Unit'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
            <input type="text" required value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="e.g. A-101" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
            <select value={form.unitType} onChange={(e) => setForm({ ...form, unitType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {UNIT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">No owner</option>
              {owners.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Save</button>
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
