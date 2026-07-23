import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import toast from 'react-hot-toast';
import { RESIDENT_TYPES } from '../utils/constants';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', identifier: '', password: '', unitId: '', residentType: 'tenant', phone: '', identityNumber: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/apartment/residents')
      .then((r) => setResidents(r.data))
      .catch((e) => {
        setError(e.response?.data?.error || 'Failed to load residents');
        toast.error('Failed to load residents');
      });
    api.get('/apartment/units')
      .then((r) => setUnits(r.data.filter((u) => u.status === 'vacant')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', identifier: '', password: '', unitId: '', residentType: 'tenant', phone: '', identityNumber: '' });
    setEditOpen(true);
  };

  const openEdit = (r) => {
    setEditItem(r);
    setForm({ name: r.name, identifier: r.identifier, password: '', unitId: r.unitId?._id || '', residentType: r.residentType || 'tenant', phone: Array.isArray(r.phone) ? r.phone.join(', ') : r.phone || '', identityNumber: r.identityNumber || '' });
    setEditOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/apartment/residents/${editItem._id}`, { name: form.name, unitId: form.unitId || null, residentType: form.residentType, phone: form.phone ? form.phone.split(',').map(p => p.trim()) : [], identityNumber: form.identityNumber });
        toast.success('Resident updated');
      } else {
        await api.post('/apartment/residents', { ...form, phone: form.phone ? form.phone.split(',').map(p => p.trim()) : [], type: 'resident' });
        toast.success('Resident created');
      }
      setEditOpen(false);
      const r = await api.get('/apartment/residents');
      setResidents(r.data);
      const u = await api.get('/apartment/units');
      setUnits(u.data.filter((u) => u.status === 'vacant'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/apartment/residents/${confirmId}`);
      toast.success('Resident deleted');
      setResidents(residents.filter((r) => r._id !== confirmId));
      setConfirmOpen(false);
      setConfirmId(null);
    } catch (err) {
      toast.error('Failed to delete resident');
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  if (loading) return <LoadingSkeleton lines={8} />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
        <Button onClick={openCreate}>+ Add Resident</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-red-700 hover:text-red-900 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identifier</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Identity</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {residents.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{r.name}</td>
                <td className="px-6 py-4 text-gray-600">{r.identifier}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 capitalize">{r.residentType || 'tenant'}</span></td>
                <td className="px-6 py-4 text-gray-600">{Array.isArray(r.phone) ? r.phone.join(', ') : r.phone || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{r.identityNumber || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{r.unitNumber || '-'}</td>
                <td className="px-6 py-4">
                  <Badge status={r.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(r)} className="text-sm text-primary-600 hover:text-primary-800 font-medium mr-3">Edit</button>
                  <button onClick={() => { setConfirmId(r._id); setConfirmOpen(true); }} className="text-sm text-red-600 hover:text-red-800 font-medium">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {residents.length === 0 && <p className="text-center text-gray-500 py-8">No residents yet</p>}
      </div>

      <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Resident" message="Delete this resident?" confirmText="Delete" danger />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editItem ? 'Edit Resident' : 'Add Resident'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login ID (unit/apartment number)</label>
            <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="e.g. B-204" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password{editItem && ' (leave blank to keep)'}</label>
            <input type="password" required={!editItem} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resident Type</label>
            <select value={form.residentType} onChange={(e) => setForm({ ...form, residentType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {RESIDENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number(s) (comma separated)</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +1234567890, +1987654321" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identity Number (SSN/ID/Passport)</label>
            <input type="text" value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Unit</label>
            <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">No unit</option>
              {units.map((u) => <option key={u._id} value={u._id}>{u.unitNumber} (Vacant)</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
